const express = require('express');
const router = express.Router();
const Compte_Commercant = require('../models/Compte_Commercant');
const Session = require('../models/Session');
const crypto = require('crypto');
const logger = require('../logger');

// Log erreur
function logAuthError(req) {
  let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
  logger.error(`[AUTH ERROR] Login ou mot de passe incorrect | ip=${ip}`);
}

// Login
router.post('/login', async (req, res) => {
  try {
    let { login, mot_de_passe } = req.body;
    if (!login || !mot_de_passe) {
      return res.status(400).json({ erreur: "Login et mot de passe obligatoires" });
    }
    let compte = await Compte_Commercant.findOne({ where: { login } });
    if (!compte) {
      logAuthError(req);
      return res.status(401).json({ erreur: "Login ou mot de passe incorrect" });
    }

// Vérification mot de passe
    let [hash, salt] = compte.mot_de_passe.split(':');
    let hashTest = crypto.scryptSync(mot_de_passe, salt, 16).toString('hex');
    if (hashTest !== hash) {
      logAuthError(req);
      return res.status(401).json({ erreur: "Login ou mot de passe incorrect" });
    }

// Cherche la session existante
    let session = await Session.findOne({ where: { id_compte: compte.id_compte } });

    if (!session) {
// Création nouvelle session
      let token = crypto.randomBytes(16).toString('hex');
      let now = new Date(); // UTC
      let expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h
      session = await Session.create({
        id_compte: compte.id_compte,
        token,
        connecter: true,
        date_creation: now,
        expires_at: expiresAt,
        closed_at: null
      });
    } else {

// Mise à jour session existante
      session.connecter = true;
      session.token = crypto.randomBytes(16).toString('hex');
      session.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); 
      session.closed_at = null; 
      await session.save();
    }
    logger.info(`[AUTH] LOGIN SUCCESS | id_compte=${compte.id_compte}`);
    res.json({
      message: "Connexion réussie",
      session: {
        id_session: session.id_session,
        token: session.token,
        id_compte: compte.id_compte
      }
    });
  } catch (err) {
    logger.error(`[AUTH] LOGIN ERROR | ${err.message}`);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
});

module.exports = router;
// Ce code appartient à la société IDEAL SOLUTIONS 
