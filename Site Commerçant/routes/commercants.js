const express = require('express');
const router = express.Router();
const Commercant = require('../models/Commercant'); // modèle Commercant
const Categorie = require('../models/Categorie'); // importe le modèle Categorie 
const Horaire = require('../models/Horaire');  // importe le modèle Horaire 
const Actualite = require('../models/Actualite'); // importe le modèle Actualite 
const Reseau_social = require('../models/Reseau_social'); // importe le modèle Reseau_social 
const Compte_Commercant = require('../models/Compte_Commercant'); // importe le modèle Compte_Commercant 
const authMiddleware = require('../middleware/authMiddleware'); // middleware qui protège les routes horaires (autorise uniquement les requêtes valides)
const logger = require('../logger'); // ajoute les logs
const multer = require('multer'); // pour gérer l'upload d'image
const path = require('path');
const fs = require('fs'); // pour vérifier/créer les dossiers

// Fonction pour loguer avec IP
function logAction(action, details, req) {
  let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
  logger.info(`[COMMERCANT] ${action} | ${details} | ip=${ip}`);
}

// Validation email pour qu'il soit adapté au bon format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validation code postal pour qu'il soit composé de 5 chiffres
function isValidCodePostal(cp) {
  return /^\d{5}$/.test(cp);
}

// Validation ville 
function isValidVille(ville) {
  return /^[A-Za-zÀ-ÖØ-öø-ÿ\s\-]{3,50}$/.test(ville.trim());
}

// Validation adresse pour qu'elle est un numéro et un nom de rue
function isValidAdresse(adresse) {
  return /^(?=.*\d)[A-Za-zÀ-ÖØ-öø-ÿ0-9\s,.'\-]{5,100}$/.test(adresse.trim());
}

// Validation téléphone pour qu'il ait 10 chiffres
function isValidTelephone(telephone) {
  return /^\d{10}$/.test(telephone);
}

// Validation site web
function isValidWebsite(url) {
  if (!url) return true; 
  try { new URL(url); return true; } 
  catch { return false; }
}

// Création des dossiers parent et sous-dossiers
let parentDir = path.join(__dirname, '../commercant');
let imagesDir = path.join(parentDir, 'images');
if (!fs.existsSync(parentDir)) {
  fs.mkdirSync(parentDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}
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

// Permet de savoir le commerçant est un admin
router.get('/session', authMiddleware, (req, res) => {
  res.json({
    id: req.user.id,
    qualite: req.user.qualite 
  });
});

// Lister tous les commerçants
router.get('/', authMiddleware, async (req, res) => {
  try {
    let commercants;
    let isAdmin = req.user.qualite === true;
    if (isAdmin) {
      commercants = await Commercant.findAll({
        include: [
          { model: Horaire, as: 'Horaire' },
          { model: Categorie, as: 'Categorie', attributes: ['libelle'] },
        ]
      });
    } else {
      if (!req.user.id_commercant) {
        return res.status(403).json({ erreur: "Accès interdit : commerçant non trouvé" });
      }
      commercants = await Commercant.findAll({
        where: { id_commercant: req.user.id_commercant },
        include: [
          { model: Horaire, as: 'Horaire' },
          { model: Categorie, as: 'Categorie', attributes: ['libelle'] },
        ]
      });
    }
    logAction('GET ALL', `count=${commercants.length}`, req);
    res.json(commercants);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[COMMERCANT] GET ALL ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Récupérer un commerçant par id
router.get('/:id', async (req, res) => {
  try {
    let commercant = await Commercant.findByPk(req.params.id);
    if (!commercant) {
      logAction('GET ONE FAILED', `id=${req.params.id}`, req);
      return res.status(404).json({ erreur: 'Commerçant non trouvée' });
    } 
    logAction('GET ONE', `id=${commercant.id}`, req);
    res.json(commercant);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[COMMERCANT] GET ONE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Ajouter un commerçant
router.post('/', authMiddleware, upload.single('image'), async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent créer un commerçant
  try {

// Vérifie si l'utilisateur est admin
    if (!req.user.qualite) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMMERCANT] CREATE FORBIDDEN | Utilisateur non admin tenté de créer un commerçant | ip=${ip}`);
      return res.status(403).json({ erreur: "Accès interdit : seuls les admins peuvent créer un commerçant" });
    }   
    let {siret, siren, nom_commercial, adresse, code_postal, ville, telephone, email, description,actif,site_web, id_categorie} = req.body;

// Vérification des champs obligatoires
    if (!siret || !siren || !nom_commercial || !adresse || !code_postal || !ville || !telephone || !email || !description || !actif === undefined || !id_categorie) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMMERCANT] CREATE ERROR | Tous les champs doivent être remplis | ip=${ip}`);
      return res.status(400).json({ erreur: "Tous les champs(siret, siren, nom_commercial, adresse, code_postal, ville, telephone, email, description,actif, id_categorie) doivent être remplis" });
    }

// Validation adresse
    if (!isValidAdresse(adresse)) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMMERCANT] CREATE ERROR | Adresse invalide | ip=${ip}`);
      return res.status(400).json({ erreur: "Adresse invalide (doit contenir un numéro et des lettres)" });
    }

// Validation code postal
    if (!isValidCodePostal(code_postal)) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMMERCANT] CREATE ERROR | Code postal invalide | ip=${ip}`);      
      return res.status(400).json({ erreur: "Code postal invalide" });
    }

// Validation ville
    if (!isValidVille(ville)) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMMERCANT] CREATE ERROR | Ville invalide | ip=${ip}`);
      return res.status(400).json({ erreur: "Ville invalide (lettres uniquement, 3-50 caractères)" });
    }

// Validation téléphone
    if (!isValidTelephone(telephone)) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMMERCANT] CREATE ERROR | Téléphone invalide | ip=${ip}`);
      return res.status(400).json({ erreur: "Téléphone invalide (10 chiffres requis)" });
    }

// Validation email
    if (!isValidEmail(email)) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMMERCANT] CREATE ERROR | Email invalide | ip=${ip}`);
      return res.status(400).json({ erreur: "Email invalide" });
    }

// Vérifier le site web
    if (site_web && !isValidWebsite(site_web)) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMMERCANT] CREATE ERROR | Site web invalide | ip=${ip}`);
      return res.status(400).json({ erreur: "Site web invalide" });
    }

// Chemin de l'image stockée dans le dossier
    let image = req.file ? req.file.filename : null;

// Vérifier id_categorie
    let idCategorieNum = parseInt(id_categorie);
    if (isNaN(idCategorieNum)) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[CATEGORIE] CREATE ERROR | id_categorie invalide | ip=${ip}`);
      return res.status(400).json({ erreur: "id_categorie invalide" });
    }

// Gestion de l'erreur Sequelize si la FK est violée
    let categorie = await Categorie.findByPk(idCategorieNum);
    if (!categorie) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMMERCANT] CREATE ERROR | La catégorie  spécifiée n'existe pas. id=${id_categorie} | ip=${ip}`);      
      return res.status(400).json({ erreur: "La catégorie spécifiée n'existe pas." });
    }

// Création du commerçant
    let nouveauCommercant = await Commercant.create({
      siret, siren, nom_commercial, adresse,
      code_postal, ville, telephone, email,
      description,site_web, actif, image, id_categorie: idCategorieNum
    });

// Gestion des horaires 
if (req.body.Horaire && Array.isArray(req.body.Horaire)) {
  for (let h of req.body.Horaire) {
    let heureDebut = h.heure_debut && h.heure_debut.trim() !== '' ? h.heure_debut : null;
    let heureFin = h.heure_fin && h.heure_fin.trim() !== '' ? h.heure_fin : null;
    await Horaire.create({
      jour: h.jour,
      ouverture: h.ouverture,
      heure_debut: heureDebut,
      heure_fin: heureFin,
      id_commercant: nouveauCommercant.id_commercant
    });
    logAction('HORAIRES CREATE', `id_commercant=${nouveauCommercant.id_commercant}, jour=${h.jour}`, req);
  }
}
    logAction('CREATE', `id=${nouveauCommercant.id_commercant}, siret= ${siret}, siren= ${siren}, 
      nom_commercial= ${nom_commercial}, adresse= ${adresse}, code_postal= ${code_postal}, ville= ${ville}, telephone= ${telephone},
      email= ${email},description= ${description}, actif= ${actif}, image=${image}, id_categorie= ${idCategorieNum}`, req);
    res.json(nouveauCommercant);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      logger.error(`[COMMERCANT] CREATE ERROR | La catégorie spécifiée n'existe pas | ip=${ip}`);
      return res.status(400).json({ erreur: "La catégorie spécifiée n'existe pas." });
    }
    logger.error(`[COMMERCANT] CREATE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Modifier un commerçant
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent modifier un commerçant
  try {
    let { nom_commercial, adresse, code_postal, ville, telephone, email, site_web, description,actif, id_categorie } = req.body;
    let imageFile = req.file;

// Récupère le commerçant depuis la base de donnée
    let commercant = await Commercant.findByPk(req.params.id);
    if (!commercant) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMMERCANT] UPDATE ERROR | Commerçant non trouvé id=${req.params.id} | ip=${ip}`);
      return res.status(404).json({ erreur: 'Commerçant non trouvé' });
    }
    let modifications = [];

// Modifier le nom commercial 
    if (nom_commercial !== undefined) {
      if (nom_commercial.trim() === '') return res.status(400).json({ erreur: "nom_commercial invalide" });
      modifications.push({ field: 'nom_commercial', before: commercant.nom_commercial, after: nom_commercial });
      commercant.nom_commercial = nom_commercial;
    }

// Modifier l'adresse si elle est au bon format
    if (adresse !== undefined) {
      if (!isValidAdresse(adresse)) return res.status(400).json({ erreur: "Adresse invalide (doit contenir un numéro et des lettres)" });
      modifications.push({ field: 'adresse', before: commercant.adresse, after: adresse });
      commercant.adresse = adresse;
    }

// Modifier le code postal s'il a 5 chiffres
    if (code_postal !== undefined) {
      if (!isValidCodePostal(code_postal)) return res.status(400).json({ erreur: "Code postal invalide" });
      modifications.push({ field: 'code_postal', before: commercant.code_postal, after: code_postal });
      commercant.code_postal = code_postal;
    }

// Modifier la ville si elle est au bon format (pas vraiment opérationnel pour le moment faudrait test avec une api)
    if (ville !== undefined) {
      if (!isValidVille(ville)) return res.status(400).json({ erreur: "Ville invalide (lettres uniquement, 3-50 caractères)" });
      modifications.push({ field: 'ville', before: commercant.ville, after: ville });
      commercant.ville = ville;
    }

// Modifier le téléphone s'il y a 10 chiffres
    if (telephone !== undefined) {
      if (!isValidTelephone(telephone)) return res.status(400).json({ erreur: "Téléphone invalide (10 chiffres requis)" });
      modifications.push({ field: 'telephone', before: commercant.telephone, after: telephone });
      commercant.telephone = telephone;
    }

// Modifier l'email s'il est au bon format
    if (email !== undefined) {
      if (!isValidEmail(email)) return res.status(400).json({ erreur: "Email invalide" });
      modifications.push({ field: 'email', before: commercant.email, after: email });
      commercant.email = email;
    }

// Modifier le site web 
if (site_web !== undefined) {
  let siteWebValue = site_web ? String(site_web).trim() : '';
  if (siteWebValue === "") {
    modifications.push({ field: 'site_web', before: commercant.site_web, after: null });
    commercant.site_web = null; 
  } else {
    try { new URL(siteWebValue); } catch {
      return res.status(400).json({ erreur: "site_web invalide" });
    }
    modifications.push({ field: 'site_web', before: commercant.site_web, after: siteWebValue });
    commercant.site_web = siteWebValue;
  }
}

// Modifier la description 
    if (description !== undefined) {
      if (description.trim() === '') return res.status(400).json({ erreur: "description invalide" });
      modifications.push({ field: 'description', before: commercant.description, after: description });
      commercant.description = description;
    }

// Modifer l'actif 
if (actif !== undefined) {
  if (typeof actif === 'string') {
    actif = actif === 'true';
  }
  if (typeof actif !== 'boolean') {
    return res.status(400).json({ erreur: "Le champ actif doit être un booléen" });
  }
  modifications.push({ field: 'actif', before: commercant.actif, after: actif });
  commercant.actif = actif;
}
// Modifier image si une image a été uploadée
if (req.body.delete_image === 'true' && !imageFile) {
  if (commercant.image) {
    const imagePath = path.join(
      __dirname,
      '..',
      'commercant',
      'images',
      commercant.image
    );
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    modifications.push({field: 'image',before: commercant.image,after: null});
    commercant.image = null;
  }
}

// Supprimer ancienne image si elle existe
if (imageFile) {
  if (commercant.image) {
    let oldImagePath = path.join(
      __dirname,
      '..',
      'commercant',
      'images',
      commercant.image
    );
    if (fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath);
    }
  }
  let filename = imageFile.filename;
  modifications.push({field: 'image',before: commercant.image,after: filename});
  commercant.image = filename;
}

// Modifier id_categorie s'il existe et qu'il est valide
    if (id_categorie !== undefined) {
      let idCategorieNum = parseInt(id_categorie);
      if (isNaN(idCategorieNum)) return res.status(400).json({ erreur: "id_categorie invalide" });

      let categorie = await Categorie.findByPk(idCategorieNum);
      if (!categorie) return res.status(400).json({ erreur: "La catégorie spécifiée n'existe pas." });

      modifications.push({ field: 'id_categorie', before: commercant.id_categorie, after: idCategorieNum });
      commercant.id_categorie = idCategorieNum;
    }

// Modifier les horaires
if (req.body.Horaire && Array.isArray(req.body.Horaire)) {
  await Horaire.destroy({ where: { id_commercant: req.params.id } });
  for (let h of req.body.Horaire) {
    let heureDebut = h.heure_debut && h.heure_debut.trim() !== '' ? h.heure_debut : null;
    let heureFin = h.heure_fin && h.heure_fin.trim() !== '' ? h.heure_fin : null;
    await Horaire.create({
      jour: h.jour,
      ouverture: h.ouverture,
      heure_debut: heureDebut,
      heure_fin: heureFin,
      id_commercant: req.params.id
    });
  }
}

// Vérifie qu'au moins un champ valide a été modifié
    if (modifications.length === 0) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMMERCANT] UPDATE ERROR | Aucun champ valide à modifier | ip=${ip}`);
      return res.status(400).json({ erreur: "Aucun champ valide fourni pour la modification" });
    }

// Sauvegarde les modifications du commerçant
    await commercant.save();

// Log détaillé avec valeur avant/après
    let modificationDetails = modifications.map(m => `${m.field}: "${m.before}" -> "${m.after}"`).join(', ');
    logAction('UPDATE', `id=${commercant.id_commercant}, ${modificationDetails}`, req);
    res.json(commercant);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[COMMERCANT] UPDATE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Supprimer un commerçant et ses données
router.delete('/:id', authMiddleware, async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent supprimer un commerçant
  try {
    let commercant = await Commercant.findByPk(req.params.id);
    if (!commercant) return res.status(404).json({ erreur: 'Commerçant non trouvé' });
    const tablesLiees = [
      { model: Horaire, nom: 'Horaire' },
      { model: Compte_Commercant, nom: 'Compte_Commercant' },
      { model: Reseau_social, nom: 'Reseau_social' },
      { model: Actualite, nom: 'Actualite' }
    ];
    for (let t of tablesLiees) {
      await t.model.destroy({ where: { id_commercant: req.params.id } });
      logAction('DELETE RELATED', `table=${t.nom}, id_commercant=${req.params.id}`, req);
    }
    if (commercant.image) {
      let imagePath = path.join(imagesDir, commercant.image);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    await commercant.destroy();
    logAction('DELETE', `id=${req.params.id}`, req);
    res.json({ message: 'Commerçant supprimé', id: req.params.id });
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[COMMERCANT] DELETE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});
module.exports = router;
// Ce code appartient à la société IDEAL SOLUTIONS