const express = require('express');
const router = express.Router();
const Session = require('../models/Session'); // importe le modèle de la table Session
const Compte_commercant = require('../models/Compte_Commercant'); // importe le modèle de la table Compte_commercant
const authMiddleware = require('../middleware/authMiddleware'); // middleware qui protège les routes horaires (autorise uniquement les requêtes valides)
const logger = require('../logger'); // ajoute les logs
const crypto = require('crypto'); // permet le cryptage

// Fonction pour loguer avec IP
function logAction(action, details, req) {
  let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
  logger.info(`[SESSION] ${action} | ${details} | ip=${ip}`);
}

// Fonction pour générer un token (à enlever si API)
function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

// Lister tous les sessions
router.get('/', async (req, res) => {
  try {
    let sessions = await Session.findAll();
    logAction('GET ALL', `count=${sessions.length}`, req);
    res.json(sessions);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[SESSION] GET ALL ERROR | ${err.message} | ip=${ip}`);   
    res.status(500).json({ erreur: err.message });
  }
});

// Récupérer une session par id
router.get('/:id', async (req, res) => {
  try {
    let session = await Session.findByPk(req.params.id);
    if (!session) {
      logAction('GET ONE FAILED', `id=${req.params.id}`, req);
      return res.status(404).json({ erreur: 'Session non trouvée' });
    } 
    res.json(session);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[SESSION] GET ONE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Ajouter une session
router.post('/', authMiddleware, async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent ajouter une session
  try {
    let { connecter, id_compte } = req.body;

// Vérifie si l'id_compte existe 
    let idCompteNum = parseInt(id_compte);
    if (isNaN(idCompteNum)) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[SESSION] CREATE ERROR | id_compte invalide | ip=${ip}`);
      return res.status(400).json({ erreur: "id_compte invalide" });
    }

// Gestion de l'erreur Sequelize si la FK est violée
    let compte = await Compte_commercant.findByPk(idCompteNum);
    if (!compte) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[SESSION] CREATE ERROR | Le compte spécifié n'existe pas. id=${id_compte} | ip=${ip}`);
      return res.status(400).json({ erreur: "Le compte spécifié n'existe pas." });
    }

// Vérifie si une session active existe déjà pour ce compte
    let sessionExistante = await Session.findOne({ where: { id_compte: idCompteNum } });
    if (sessionExistante) {
      logAction('CREATE SKIPPED', `Session déjà active pour id_compte=${idCompteNum}`, req);
      return res.json(sessionExistante);
    }

// Génération de token 
    let token = generateToken();

    let expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // +24 heures

// Création du compte lié au commerçant existant
    let nouvelleSession = await Session.create({
      connecter: Boolean(connecter), 
      token,
      id_compte: idCompteNum,
      expires_at: expiresAt
    });
    logAction('CREATE', `id=${nouvelleSession.id_session}, id_compte=${idCompteNum}`, req);
    res.json(nouvelleSession);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      logger.error(`[SESSION] CREATE ERROR | Le compte spécifié n'existe pas | ip=${ip}`);
      return res.status(400).json({ erreur: "Le compte spécifié n'existe pas." });
    }
    logger.error(`[SESSION] CREATE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Modifier une session
router.put('/:id', authMiddleware, async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent modifier une session
  try {
    let { connecter, id_compte } = req.body;

// Récupère la session par PK
    let session = await Session.findByPk(req.params.id);
    if (!session){
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[SESSION] UPDATE ERROR | Session non trouvée id=${req.params.id} | ip=${ip}`);
      return res.status(404).json({ erreur: 'Session non trouvée' });
    }
    let modifications = [];
    let hasRealModification = false; // Sert à savoir s'il faut régénérer le token

// Modifier l'état connecter
if (connecter !== undefined && typeof connecter === 'boolean') {
  if (session.connecter !== connecter) {  // si la valeur change réellement
    modifications.push({ field: 'connecter', before: session.connecter, after: connecter });
    session.connecter = connecter;
    hasRealModification = true;

// Mettre closed_at si on se déconnecte
    if (connecter === false) {
      session.closed_at = new Date();
    } else if (connecter === true) {
      session.closed_at = null; // réinitialise si on se reconnecte
    }
  }
}

// Génération automatique du token uniquement s'il y a eu une modification
if (hasRealModification) {
  session.token_access = generateToken();
}

// Modifier le compte si spécifié
    if (id_compte !== undefined) {
      let idCompteNum = parseInt(id_compte);
      if (isNaN(idCompteNum)) {return res.status(400).json({ erreur: "id_compte invalide" });}
      let compte = await Compte_commercant.findByPk(idCompteNum);
      if (!compte) {return res.status(400).json({ erreur: "Le compte spécifié n'existe pas." });}
      modifications.push({ field: 'id_compte', before: session.id_compte, after: idCompteNum });
      session.id_compte = idCompteNum;
    }

// Sauvegarde les modifications pour la session 
    await session.save(); 

// Log détaillé avec valeur avant/après
    let modificationDetails = modifications.map(m => `${m.field}: "${m.before}" -> "${m.after}"`).join(', ');
    logAction('UPDATE', `id=${session.id_compte}, ${modificationDetails}`, req);    
    res.json(session);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[SESSION] UPDATE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Supprimer une session
router.delete('/:id', authMiddleware, async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent supprimer une session
  try {
    let session = await Session.findByPk(req.params.id);
    if (!session) return res.status(404).json({ erreur: 'Session non trouvée' });
    await session.destroy();
    logAction('DELETE', `id=${req.params.id}`, req);
    res.json({ message: 'Session supprimée', id: req.params.id });
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[SESSION] DELETE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
// Ce code appartient à la société IDEAL SOLUTIONS