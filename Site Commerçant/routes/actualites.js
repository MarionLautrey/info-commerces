const express = require('express');
const router = express.Router();
const Actualite = require('../models/Actualite'); // importe le modèle de la table Actualite
const Commercant = require('../models/Commercant'); // importe le modèle de la table Commercant
const Compte_Commercant = require('../models/Compte_Commercant'); // importe le modèle Compte_Commercant 
const authMiddleware = require('../middleware/authMiddleware'); // middleware qui protège les routes actualites (autorise uniquement les requêtes valides)
const logger = require('../logger'); // ajoute les logs
const multer = require('multer'); // pour gérer l'upload d'image
const path = require('path');
const fs = require('fs'); // pour vérifier/créer les dossiers

// Fonction pour loguer avec IP
function logAction(action, details, req) {
  let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
  logger.info(`[ACTUALITE] ${action} | ${details} | ip=${ip}`);
}

// Validation format date
function formatDate(date) {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0]; // YYYY-MM-DD
}

// Création des dossiers parent et sous-dossiers
let parentDir = path.join(__dirname, '../actualite');
let imagesDir = path.join(parentDir, 'images');
if (!fs.existsSync(parentDir)) {
  fs.mkdirSync(parentDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Multer config 
let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    let idCommercant = req.user?.id_commercant || 'unknown';
    let ext = path.extname(file.originalname);
    cb(null, `commercant${idCommercant}_${Date.now()}${ext}`);
  }
});
let upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Seules les images sont autorisées'), false);
    }
    cb(null, true);
  }
});

// Lister toutes les actualités
router.get('/', authMiddleware, async (req, res) => {
  try {
// Récupérer le compte et le commerçant associé
    let compte = await Compte_Commercant.findByPk(req.user.id_compte);
    if (!compte) return res.status(401).json({ erreur: 'Compte introuvable' });
    let isAdmin = !!compte.qualite; // true = admin
    let actualites;
    if (isAdmin) {

// Admin voit tout
      actualites = await Actualite.findAll();
    } else {
      if (!compte.id_commercant) 
        return res.status(403).json({ erreur: 'Commerçant non lié à ce compte' });

// Non-admin : uniquement les actualités liées à ce commerçant
      actualites = await Actualite.findAll({
        where: { id_commercant: compte.id_commercant }
      });
    }
    let json = actualites.map(a => {
      let obj = a.toJSON();
      obj.date_publication = formatDate(obj.date_publication);
      obj.updatedAt = a.updatedAt;
      return obj;
    });
    logAction('GET ALL', `count=${json.length}`, req);
    res.json(json);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[ACTUALITE] GET ALL ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Ajouter une actualité
router.post('/',authMiddleware,upload.single('image'),async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent créer une actualité et ajout upload.single('image')
  try {
    let {titre, contenu } = req.body;
    let id_commercant = req.user.id_commercant;
    let publie_facebook = false;
    let publie_instagram = false;

// Vérification des champs obligatoires
    if (!titre || !contenu) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[ACTUALITE] CREATE ERROR | Tous les champs doivent être remplis | ip=${ip}`);
      return res.status(400).json({ erreur: "Tous les champs (titre, contenu, publie_facebook, publie_instagram, id_commercant) doivent être remplis" });
    }

// Vérifier si l'id commercant existe
    let idCommercantNum = parseInt(id_commercant);
    if (isNaN(idCommercantNum)) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[ACTUALITE] CREATE ERROR | id_commercant invalide | ip=${ip}`);
      return res.status(400).json({ erreur: "id_commercant invalide" });
    }

// Gestion de l'erreur Sequelize si la FK est violée
    let commercant = await Commercant.findByPk(idCommercantNum);
    if (!commercant) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[ACTUALITE] CREATE ERROR | Le commerçant spécifié n'existe pas. id=${id_commercant} | ip=${ip}`);
      return res.status(400).json({ erreur: "Le commerçant spécifié n'existe pas." });
    }

// Chemin de l'image stockée dans le dossier
    let chemin_img = req.file ? req.file.filename : null;

// Création de l'actualité lié au commerçant existant
    let nouvelleActualite = await Actualite.create({ titre, contenu, date_publication: new Date(), publie_facebook, publie_instagram, chemin_img, id_commercant: idCommercantNum});
    let actualiteJson = nouvelleActualite.toJSON();              
    actualiteJson.date_publication = formatDate(actualiteJson.date_publication); // formate la date
    logAction('CREATE', `id=${nouvelleActualite.id_actualite}, titre=${titre}, contenu= ${contenu},chemin_img=${chemin_img}, id_commercant=${idCommercantNum}`, req);
    res.json(actualiteJson);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      logger.error(`[ACTUALITE] CREATE ERROR | Le compte spécifié n'existe pas | ip=${ip}`);
      return res.status(400).json({ erreur: "Le compte spécifié n'existe pas." });
    }
    logger.error(`[ACTUALITE] CREATE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Modifier une actualité
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent modifier une actualité
  try {
    let { titre,contenu,publie_facebook, publie_instagram, id_commercant } = req.body;
    let imageFile = req.file;

// Récupère l'actualité depuis la base de donnée
    let actualite = await Actualite.findByPk(req.params.id);
    if (!actualite) { 
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress ||'unknown';
      logger.error(`[ACTUALITE] UPDATE ERROR | Actualité non trouvée id=${req.params.id} | ip=${ip}`);
      return res.status(404).json({ erreur: 'Actualité non trouvée' });
    }
    let modifications = [];

// Modifier le titre
    if (titre !== undefined) {
      if (titre.trim() === '') {
        return res.status(400).json({ erreur: "titre invalide" });
      }
      modifications.push({
        field: 'titre',before: actualite.titre,after: titre});
      actualite.titre = titre;
    }

// Modifier le contenu
    if (contenu !== undefined) {
      if (contenu.trim() === '') {
        return res.status(400).json({ erreur: "contenu invalide" });
      }
      modifications.push({
        field: 'contenu',before: actualite.contenu,after: contenu});
      actualite.contenu = contenu;
    }

// Modifier publie_facebook
    if (publie_facebook !== undefined) {
      if (typeof publie_facebook !== 'boolean') {
        return res.status(400).json({
          erreur: "Le champ publie_facebook doit être un booléen"
        });
      }
      modifications.push({
      field: 'publie_facebook',before: actualite.publie_facebook,after: publie_facebook});
      actualite.publie_facebook = publie_facebook;
    }

// Modifier publie_instagram
    if (publie_instagram !== undefined) {
      if (typeof publie_instagram !== 'boolean') {
        return res.status(400).json({
          erreur: "Le champ publie_instagram doit être un booléen"
        });
      }
      modifications.push({
      field: 'publie_instagram',before: actualite.publie_instagram,after: publie_instagram});
      actualite.publie_instagram = publie_instagram;
    }

// Modifier chemin_img si une image a été uploadée
if (req.body.delete_image === 'true' && !imageFile) {
  if (actualite.chemin_img) {
    const imagePath = path.join(
      __dirname,
      '..',
      'actualite',
      'images',
      actualite.chemin_img
    );
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    modifications.push({field: 'chemin_img',before: actualite.chemin_img,after: null});
    actualite.chemin_img = null;
  }
}

// Supprimer ancienne image si elle existe
if (imageFile) {
  if (actualite.chemin_img) {
    let oldImagePath = path.join(
      __dirname,
      '..',
      'actualite',
      'images',
      actualite.chemin_img
    );
    if (fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath);
    }
  }
  let filename = imageFile.filename;
  modifications.push({field: 'chemin_img',before: actualite.chemin_img,after: filename});
  actualite.chemin_img = filename;
}

// Mettre à jour la date d'autorisation à la modification
    let oldDate = actualite.date_publication;
    actualite.date_publication = new Date();
    modifications.push({ field: 'date_publication',before: oldDate,after: actualite.date_publication});

// Modifier id_commercant si présent et valide
    if (id_commercant !== undefined) {
      let idCommercantNum = parseInt(id_commercant);
      if (isNaN(idCommercantNum)) {
        return res.status(400).json({ erreur: "id_commercant invalide" });
      }
      let commercant = await Commercant.findByPk(idCommercantNum);
      if (!commercant) {return res.status(400).json({ erreur: "Le commerçant spécifié n'existe pas." });}
      if (idCommercantNum !== actualite.id_commercant) {
        modifications.push({ field: 'id_commercant',before: actualite.id_commercant,after: idCommercantNum});
        actualite.id_commercant = idCommercantNum;
      }
    }

// Vérifie qu'au moins un champ valide a été modifié
    if (modifications.length === 0) {
      return res.status(400).json({erreur: "Aucun champ valide fourni pour la modification"});
    }

// Sauvegarde dans la base
    await actualite.save();

// Log détaillé avec valeur avant/après 
    let modificationDetails = modifications.map(m => `${m.field}: "${m.before}" -> "${m.after}"`).join(', ');
    logAction('UPDATE',`id=${actualite.id_actualite}, ${modificationDetails}`,req);
    res.json(actualite);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[ACTUALITE] UPDATE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Supprimer une actualité
router.delete('/:id',authMiddleware, async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent supprimer une actualité
  try {
    let actualite = await Actualite.findByPk(req.params.id);
    if (!actualite) return res.status(404).json({ erreur: 'Actualité non trouvée' });
    if (actualite.chemin_img) {
      let imagePath = path.join(imagesDir, actualite.chemin_img);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    await actualite.destroy();
    logAction('DELETE', `id=${req.params.id}`, req);
    res.json({ message: 'Actualité supprimée', id: req.params.id });
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[ACTUALITE] DELETE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});
module.exports = router;
// Ce code appartient à la société IDEAL SOLUTIONS