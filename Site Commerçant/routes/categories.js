const express = require('express');
const router = express.Router();
const Categorie = require('../models/Categorie'); // importe le modèle de la table Categorie
const authMiddleware = require('../middleware/authMiddleware');// middleware qui protège les routes categories (autorise uniquement les requêtes valides)
const logger = require('../logger'); // ajoute les logs

// Fonction pour loguer avec IP
function logAction(action, details, req) {
  let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
  logger.info(`[CATEGORIE] ${action} | ${details} | ip=${ip}`);
}

// Lister toutes les catégories
router.get('/', async (req, res) => {
  try {
    let categories = await Categorie.findAll();
    logAction('GET ALL', `count=${categories.length}`, req);
    res.json(categories);
  } catch (err) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown'; // ajout IP pour le log d'erreur
      logger.error(`[CATEGORIE] GET ALL ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Récupérer une catégorie par id
router.get('/:id', async (req, res) => {
  try {
    let categorie = await Categorie.findByPk(req.params.id);
    if (!categorie) {
      logAction('GET ONE FAILED', `id=${req.params.id}`, req);
      return res.status(404).json({ erreur: 'Catégorie non trouvée' });
    } 
    logAction('GET ONE', `id=${categorie.id}`, req);
    res.json(categorie);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[CATEGORIE] GET ONE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Ajouter une catégorie
router.post('/', authMiddleware, async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent créer une catégorie
  try {
    let { libelle, description } = req.body;

// Vérification des champs obligatoires
    if (!libelle ) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMMERCANT] CREATE ERROR | Tous les champs doivent être remplis | ip=${ip}`);
      return res.status(400).json({ erreur: "Tous les champs(libelle, description) doivent être remplis" });
    }

// Création de la catégorie
    let nouvelleCategorie = await Categorie.create({ libelle, description });
    logAction('CREATE', `id= ${nouvelleCategorie.id_categorie}, libelle= ${libelle}, description= ${description}`, req);
    res.json(nouvelleCategorie);
  } catch (err) {
    logger.error(`[CATEGORIE] CREATE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Modifier une catégorie
router.put('/:id', authMiddleware,async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent modifier une catégorie
  try {
    let { libelle, description } = req.body;
    let categorie = await Categorie.findByPk(req.params.id);
    if (!categorie) {
        let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
        logger.error(`[CATEGORIE] UPDATE ERROR | Catégorie non trouvé id=${req.params.id} | ip=${ip}`);
        return res.status(404).json({ erreur: 'Catégorie non trouvée' });
    } 
    let modifications = [];

// Modifier le libelle 
    if (libelle !== undefined) {
      if (libelle.trim() === '') return res.status(400).json({ erreur: "libelle invalide" });
      modifications.push({ field: 'libelle', before: categorie.libelle, after: libelle });
      categorie.libelle = libelle;
    }

// Vérifie qu'au moins un champ valide a été modifié
    if (modifications.length === 0) return res.status(400).json({ erreur: "Aucun champ valide fourni pour la modification" });
    await categorie.save();

// Log détaillé avec valeur avant/après
    let modificationDetails = modifications.map(m => `${m.field}: "${m.before}" -> "${m.after}"`).join(', ');
    logAction('UPDATE', `id=${categorie.id_categorie}, ${modificationDetails}`, req);
    res.json(categorie);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[CATEGORIE] UPDATE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Supprimer une catégorie
router.delete('/:id',authMiddleware, async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent supprimer une catégorie
  try {
    let categorie = await Categorie.findByPk(req.params.id);
    if (!categorie) return res.status(404).json({ erreur: 'Catégorie non trouvée' });
    await categorie.destroy();
    logAction('DELETE', `id=${req.params.id}`, req);
    res.json({ message: 'Catégorie supprimée', id: req.params.id });
  } catch (err) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[CATEGORIE] DELETE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
// Ce code appartient à la société IDEAL SOLUTIONS