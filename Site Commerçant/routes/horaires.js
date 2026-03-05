const express = require('express');
const router = express.Router();
const Horaire = require('../models/Horaire'); // importe le modèle de la table Horaire
const Commercant = require('../models/Commercant');// importe le modèle de la table Commercant
const authMiddleware = require('../middleware/authMiddleware'); // middleware qui protège les routes horaires (autorise uniquement les requêtes valides)
const logger = require('../logger'); // ajoute les logs

// Fonction pour loguer avec IP
function logAction(action, details, req) {
  let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
  logger.info(`[HORAIRE] ${action} | ${details} | ip=${ip}`);
}

// Lister tous les horaires
router.get('/', async (req, res) => {
  try {
    let horaires = await Horaire.findAll();
    logAction('GET ALL', `count=${horaires.length}`, req);
    res.json(horaires);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown'; // ajout IP pour le log d'erreur
    logger.error(`[HORAIRE] GET ALL ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Récupérer un horaire par id
router.get('/:id', async (req, res) => {
  try {
    let horaire = await Horaire.findByPk(req.params.id);
    if (!horaire) {
      logAction('GET ONE FAILED', `id=${req.params.id}`, req);
      return res.status(404).json({ erreur: 'Horaire non trouvé' });
    }
    logAction('GET ONE', `id=${horaire.id_horaire}`, req);
    res.json(horaire);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[HORAIRE] GET ONE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Format de l'heure
function isValidTime(str) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(str);
}
// Format du jour
function isValidJour(jour) {
  const joursValides = [
    'lundi',
    'mardi',
    'mercredi',
    'jeudi',
    'vendredi',
    'samedi',
    'dimanche'
  ];
  return joursValides.includes(
    jour.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  );
}

// Ajouter un horaire
router.post('/', authMiddleware, async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent créer un horaire
  try {
    let { jour, heure_debut, heure_fin, ouverture, id_commercant } = req.body;

// Vérifier que tous les champs sont remplis
if (!jour || ouverture === undefined || !id_commercant) {
  let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
  logger.error(`[HORAIRE] CREATE ERROR | Tous les champs obligatoires doivent être remplis | ip=${ip}`);
  return res.status(400).json({ erreur: "Les champs obligatoires (jour, ouverture, id_commercant) doivent être remplis" });
}

// Vérifier le jour
    if (!isValidJour(jour)) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[HORAIRE] CREATE ERROR | jour invalide | ip=${ip}`);
      return res.status(400).json({ erreur: "jour doit être un jour valide de la semaine" });
    }

// Vérifier ouverture
if (typeof ouverture === 'string') {
  ouverture = ouverture.toLowerCase() === 'true';
} else if (typeof ouverture !== 'boolean') {
  let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
  logger.error(`[HORAIRE] CREATE ERROR | ouverture invalide | ip=${ip}`);
  return res.status(400).json({ erreur: "ouverture doit être un booléen" });
}

// Vérifier le format des heures
if (ouverture) {
  if (!heure_debut || !heure_fin) {
    return res.status(400).json({ erreur: "heure_debut et heure_fin obligatoires si le commerçant est ouvert" });
  }
  if (!isValidTime(heure_debut) || !isValidTime(heure_fin)) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[HORAIRE] CREATE ERROR | Format heure invalide | ip=${ip}`);
    return res.status(400).json({ erreur: "heure_debut et heure_fin doivent être au format HH:mm" });
  }
} else {
  heure_debut = null;
  heure_fin = null;
}

// Vérifier id_commercant
    let idCommercantNum = parseInt(id_commercant);
    if (isNaN(idCommercantNum)) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[HORAIRE] CREATE ERROR | id_commercant invalide | ip=${ip}`);
      return res.status(400).json({ erreur: "id_commercant invalide" });
    }

// Gestion de l'erreur Sequelize si la FK est violée
    let commercant = await Commercant.findByPk(idCommercantNum);
    if (!commercant) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[HORAIRE] CREATE ERROR | Le commerçant spécifié n'existe pas. id=${id_commercant} | ip=${ip}`);
      return res.status(400).json({ erreur: "Le commerçant spécifié n'existe pas." });
    }
    
// Création de l'horaire
    let nouveauHoraire = await Horaire.create({jour,heure_debut,heure_fin,ouverture,id_commercant: idCommercantNum });
    logAction('CREATE', `id_horaire= ${nouveauHoraire.id_horaire}, jour= ${jour}, heure_debut= ${heure_debut}, ouverture= ${ouverture},heure_fin= ${heure_fin},  id_commercant= ${idCommercantNum}`, req);
    res.json(nouveauHoraire);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      logger.error(`[HORAIRE] CREATE ERROR | Le commerçant spécifié n'existe pas | ip=${ip}`);
      return res.status(400).json({ erreur: "Le commerçant spécifié n'existe pas." });
    }
    logger.error(`[HORAIRE] CREATE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Modifier un horaire
router.put('/:id', authMiddleware, async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent modifier un horaire
  try {
    let { jour, heure_debut, heure_fin,ouverture, id_commercant } = req.body;
    let horaire = await Horaire.findByPk(req.params.id);
    if (!horaire) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[HORAIRE] UPDATE ERROR | Horaire non trouvé id=${req.params.id} | ip=${ip}`);
      return res.status(404).json({ erreur: 'Horaire non trouvé' });
    }
    let modifications = [];

// Modifier jour si présent
    if (jour !== undefined) {
      if (jour === '' || !isValidJour(jour)) {
        let ip = req?.headers['x-forwarded-for']?.split(',').shift()|| req?.ip || req?.socket?.remoteAddress || 'unknown';
        logger.error(`[HORAIRE] UPDATE ERROR | jour invalide | ip=${ip}`);
        return res.status(400).json({ erreur: "jour doit être un jour valide de la semaine" });
      }
      modifications.push({ field: 'jour', before: horaire.jour, after: jour });
      horaire.jour = jour;
    }

// Modifier heure_debut si présent et valide
    if (heure_debut !== undefined) {
      if (horaire.ouverture === false) {
        let ip = req?.headers['x-forwarded-for']?.split(',').shift()|| req?.ip || req?.socket?.remoteAddress || 'unknown';
        logger.error(`[HORAIRE] UPDATE ERROR | heure_debut défini alors que fermé | ip=${ip}`);
        return res.status(400).json({ erreur: "Impossible de définir une heure si le commerce est fermé"
        });
      }
      if (heure_debut === '' || !isValidTime(heure_debut)) {
        let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
        logger.error(`[HORAIRE] UPDATE ERROR | Format heure_debut invalide | ip=${ip}`);
        return res.status(400).json({ erreur: "heure_debut doit être au format HH:mm" });
      }
      modifications.push({field: 'heure_debut',before: horaire.heure_debut, after: heure_debut});
      horaire.heure_debut = heure_debut;
    }

// Modifier heure_fin si présent et valide
    if (heure_fin !== undefined) {
      if (horaire.ouverture === false) {
        let ip = req?.headers['x-forwarded-for']?.split(',').shift()|| req?.ip || req?.socket?.remoteAddress || 'unknown';
        logger.error(`[HORAIRE] UPDATE ERROR | heure_fin définie alors que fermé | ip=${ip}`);
        return res.status(400).json({erreur: "Impossible de définir une heure si le commerce est fermé"});
      }
      if (heure_fin === '' || !isValidTime(heure_fin)) {
        let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
        logger.error(`[HORAIRE] UPDATE ERROR | Format heure_fin invalide | ip=${ip}`);
        return res.status(400).json({ erreur: "heure_fin doit être au format HH:mm" });
      }
      modifications.push({field: 'heure_fin',before: horaire.heure_fin,after: heure_fin});
      horaire.heure_fin = heure_fin;
    }

// Modifier l'ouverture
    if (ouverture !== undefined) {
      if (typeof ouverture !== 'boolean') {
        let ip = req?.headers['x-forwarded-for']?.split(',').shift()|| req?.ip || req?.socket?.remoteAddress || 'unknown';
        logger.error(`[HORAIRE] UPDATE ERROR | ouverture invalide | ip=${ip}`);
        return res.status(400).json({ erreur: "ouverture doit être un booléen" });
      }
      modifications.push({field: 'ouverture',before: horaire.ouverture,after: ouverture});
      horaire.ouverture = ouverture;

// Si le commerce est fermé 
      if (!ouverture) {
        modifications.push({ field: 'heure_debut', before: horaire.heure_debut, after: null },{ field: 'heure_fin', before: horaire.heure_fin, after: null });
        horaire.heure_debut = null;
        horaire.heure_fin = null;
      }
}
// Si ouverture
    if (horaire.ouverture === true && (!horaire.heure_debut || !horaire.heure_fin)) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[HORAIRE] UPDATE ERROR | ouvert sans heures | ip=${ip}`);
      return res.status(400).json({erreur: "heure_debut et heure_fin obligatoires si le commerce est ouvert"});
    }

// Modifier id_commercant si présent et valide
    if (id_commercant !== undefined) {
      let idCommercantNum = parseInt(id_commercant);
      if (isNaN(idCommercantNum)) {
        let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
        logger.error(`[HORAIRE] UPDATE ERROR | id_commercant invalide | ip=${ip}`);
        return res.status(400).json({ erreur: "id_commercant invalide" });
      }
      let commercant = await Commercant.findByPk(idCommercantNum);
      if (!commercant) {
        let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
        logger.error(`[HORAIRE] UPDATE ERROR | Le commerçant spécifié n'existe pas id=${id_commercant} | ip=${ip}`);
        return res.status(400).json({ erreur: "Le commerçant spécifié n'existe pas." });
      }
      modifications.push({ field: 'id_commercant', before: horaire.id_commercant, after: idCommercantNum });
      horaire.id_commercant = idCommercantNum;
    }

// Vérifie qu'au moins un champ valide a été modifié
    if (modifications.length === 0) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[HORAIRE] UPDATE ERROR | Aucun champ valide à modifier | ip=${ip}`);
      return res.status(400).json({ erreur: "Aucun champ valide fourni pour la modification" });
    }

// Sauvegarde les modifications d'un horaire
    await horaire.save();

// Log détaillé avec valeur avant/après
    let modificationDetails = modifications.map(m => `${m.field}: "${m.before}" -> "${m.after}"`).join(', ');
    logAction('UPDATE', `id=${horaire.id_horaire}, ${modificationDetails}`, req);
    res.json(horaire);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[HORAIRE] UPDATE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Supprimer un horaire
router.delete('/:id', authMiddleware, async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent supprimer un horaire 
  try {
    let horaire = await Horaire.findByPk(req.params.id);
    if (!horaire) return res.status(404).json({ erreur: 'Horaire non trouvé' });
    await horaire.destroy();
    logAction('DELETE', `id=${req.params.id}`, req);
    res.json({ message: 'Horaire supprimé', id: req.params.id });
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[HORAIRE] DELETE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
// Ce code appartient à la société IDEAL SOLUTIONS