const express = require('express');
const router = express.Router();
const Session = require('../models/Session'); // importe le modèle de la table Session
const logger = require('../logger'); // ajoute les logs

// Partie déconnexion
router.post('/logout', async (req, res) => {
  try {
// Récupère le token 
    let token = req.headers['x-auth'];
    
// Récupère l'IP 
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';

// Token absent
    if (!token) {
      logger.error(`[AUTH] ACCESS DENIED | POST /sessions/logout | x-auth=absent | ip=${ip}`);
      return res.status(401).json({ erreur: "Token absent" });
    }

// Cherche la session correspondante
    let session = await Session.findOne({ where: { token } });
    if (!session) {
      logger.error(`[AUTH] ACCESS DENIED | POST /sessions/logout | token invalide | ip=${ip}`);
      return res.status(401).json({ erreur: "Token invalide" });
    }

// Marque la session comme déconnectée
    session.connecter = false;
    session.closed_at = new Date(); 
    session.token = null;           
    await session.save();

// Log lors de la déconnexion
    logger.info(`[AUTH] LOGOUT SUCCESS | session_id=${session.id_session}, id_compte=${session.id_compte} | ip=${ip}`);

// Réponse JSON
    res.json({ message: "Déconnexion réussie" });
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[AUTH] LOGOUT ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: "Erreur serveur" });
  }
});

module.exports = router;
// Ce code appartient à la société IDEAL SOLUTIONS
