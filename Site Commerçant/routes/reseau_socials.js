const express = require('express');
const router = express.Router();
const Reseau_social = require('../models/Reseau_social');// importe le modèle de la table Reseau_social
const Commercant = require('../models/Commercant');// importe le modèle de la table Commercant
const authMiddleware = require('../middleware/authMiddleware'); // middleware qui protège les routes reseau_social (autorise uniquement les requêtes valides)
const logger = require('../logger'); // ajoute les logs
const crypto = require('crypto'); // permet le cryptage

// Fonction pour loguer avec IP
function logAction(action, details, req) {
  let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
  logger.info(`[RESEAU_SOCIAL] ${action} | ${details} | ip=${ip}`);
}

// Fonction pour générer un token (à enlever si API)
function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

// Validation format date
function formatDate(date) {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0]; // YYYY-MM-DD
}

// Lister tous les réseaux sociaux
router.get('/', async (req, res) => {
  try {
    let reseau_socials = await Reseau_social.findAll();
    logAction('GET ALL', `count=${reseau_socials.length}`, req);

// On formate la date_autorisation pour chaque reseau
    let json = reseau_socials.map(c => {
      let obj = c.toJSON();
      obj.date_autorisation = formatDate(obj.date_autorisation);
      return obj;
    });
    res.json(json);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown'; // ajout IP pour le log d'erreur
    logger.error(`[RESEAU_SOCIAL] GET ALL ERROR | ${err.message} | ip=${ip}`);   
    res.status(500).json({ erreur: err.message });
  }
});

// Récupérer un réseau social par id
router.get('/:id', async (req, res) => {
  try {
    let reseau_social = await Reseau_social.findByPk(req.params.id);
    if (!reseau_social) {
      logAction('GET ONE FAILED', `id=${req.params.id}`, req);
      return res.status(404).json({ erreur: 'Réseau social non trouvé' });
    }
    logAction('GET ONE', `id=${reseau_social.id}`, req);
    let json = reseau_social.toJSON();
    json.date_autorisation = formatDate(json.date_autorisation);
    res.json(json);
  } catch (err) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[RESEAU_SOCIAL] GET ONE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Ajouter un réseau social
router.post('/', authMiddleware, async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent créer un réseau social
  try {
    let{type,id_commercant}  = req.body;

// Vérification des champs obligatoires
    if (!type || !id_commercant) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[RESEAU_SOCIAL] CREATE ERROR | Tous les champs doivent être remplis | ip=${ip}`);
      return res.status(400).json({ erreur: "Tous les champs(type,id_commercant) doivent être remplis" });
    }

// Vérifier si l'id commercant existe
    let idCommercantNum = parseInt(id_commercant);
    if (isNaN(idCommercantNum)) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[RESEAU_SOCIAL] CREATE ERROR | id_commercant invalide | ip=${ip}`);
      return res.status(400).json({ erreur: "id_commercant invalide" });
    }

// Gestion de l'erreur Sequelize si la FK est violée
    let commercant = await Commercant.findByPk(idCommercantNum);
    if (!commercant) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[RESEAU_SOCIAL] CREATE ERROR | Le commerçant spécifié n'existe pas. id=${id_commercant} | ip=${ip}`);
      return res.status(400).json({ erreur: "Le commerçant spécifié n'existe pas." });
    }

// Génération de token 
    let token_access = generateToken();

// Création du compte lié au commerçant existant
    let nouveauReseau_social = await Reseau_social.create({type,token_access,date_autorisation: new Date(),id_commercant: idCommercantNum});
    let json = nouveauReseau_social.toJSON();
    json.date_autorisation = formatDate(json.date_autorisation); // formate la date
    logAction('CREATE', `id= ${nouveauReseau_social.id_reseau},type= ${type}, date_autorisation= ${nouveauReseau_social.date_autorisation}, id_commercant= ${idCommercantNum}`, req);
    res.json(json);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      logger.error(`[RESEAU_SOCIAL] CREATE ERROR | Le compte spécifié n'existe pas | ip=${ip}`);
      return res.status(400).json({ erreur: "Le compte spécifié n'existe pas." });
    }
      logger.error(`[RESEAU_SOCIAL] CREATE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Modifier un réseau social
router.put('/:id', authMiddleware, async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent modifier un réseau social
  try {
    let { type, id_commercant } = req.body;
    let reseau_social = await Reseau_social.findByPk(req.params.id);
    if (!reseau_social) { 
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[RESEAU_SOCIAL] UPDATE ERROR | Réseau social non trouvé id=${req.params.id} | ip=${ip}`);
      return res.status(404).json({ erreur: 'Réseau social non trouvé' });
    }
    let modifications = [];
    let hasRealModification = false; // Sert à savoir s'il faut régénérer le token

// Validation et modification du type
    let allowedTypes = ['facebook', 'instagram'];
    if (type !== undefined) {
      type = type.trim().toLowerCase();
      if (!allowedTypes.includes(type)) {
        return res.status(400).json({ erreur: `type invalide, doit être: ${allowedTypes.join(', ')}` });
      }

// Modification uniquement si la valeur change réellement
      if (type !== reseau_social.type) {
        modifications.push({field: 'type',before: reseau_social.type, after: type});
        reseau_social.type = type;
        hasRealModification = true;
      }
    }

// Modifier id_commercant si présent et valide
    if (id_commercant !== undefined) {
      let idCommercantNum = parseInt(id_commercant);
      if (isNaN(idCommercantNum)) {
        return res.status(400).json({ erreur: "id_commercant invalide" });
      }
      let commercant = await Commercant.findByPk(idCommercantNum);
      if (!commercant) {
        return res
          .status(400)
          .json({ erreur: "Le commerçant spécifié n'existe pas." });
      }

// Modification uniquement si la valeur change réellement
      if (idCommercantNum !== reseau_social.id_commercant) {
        modifications.push({
          field: 'id_commercant',
          before: reseau_social.id_commercant,
          after: idCommercantNum
        });
        reseau_social.id_commercant = idCommercantNum;
        hasRealModification = true;
      }
    }

// Génération automatique du token uniquement s'il y a eu une modification
    if (hasRealModification) {
      reseau_social.token_access = generateToken();

// Mettre à jour la date d'autorisation à la modification
      let oldDate = reseau_social.date_autorisation;
      reseau_social.date_autorisation = new Date();
      modifications.push({field: 'date_autorisation',before: oldDate,after: reseau_social.date_autorisation});}

// Sauvegarde les modifications pour le réseau social
    await reseau_social.save();

// Affichage format de la date
    let json = reseau_social.toJSON();
    json.date_autorisation = formatDate(json.date_autorisation);

// Log détaillé avec valeur avant/après 
    let modificationDetails = modifications.map(m => `${m.field}: "${m.before}" -> "${m.after}"`).join(', ');
    logAction('UPDATE',`id=${reseau_social.id_commercant}, ${modificationDetails}`,req);
    res.json(json);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[RESEAU_SOCIAL] UPDATE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Supprimer un réseau social
router.delete('/:id', authMiddleware, async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent supprimer un réseau social
  try {
    let reseau_social = await Reseau_social.findByPk(req.params.id);
    if (!reseau_social) return res.status(404).json({ erreur: 'Réseau social non trouvé' });
    await reseau_social.destroy();
    logAction('DELETE', `id=${req.params.id}`, req);
    res.json({ message: 'Réseau social supprimé', id: req.params.id });
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[RESEAU_SOCIAL] DELETE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
// Ce code appartient à la société IDEAL SOLUTIONS