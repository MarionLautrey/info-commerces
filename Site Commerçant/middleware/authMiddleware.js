const logger = require('../logger'); 
const Session = require('../models/Session'); // table sessions 
const Compte_Commercant = require('../models/Compte_Commercant'); // table commerçants 

// Date locale
function nowParis() {
  return new Date(new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }));
}

// Session 
let authMiddleware = async (req, res, next) => { 
  try {  
    let token = req.headers['x-auth']; 
    if (!token) { 
      logger.error(`[AUTH] ACCESS DENIED | ${req.method} ${req.originalUrl} | x-auth absent`); 
      return res.status(401).json({ erreur: 'Non autorisé' }); 
    }
    let session = await Session.findOne({ where: { token } });
    if (!session || !session.connecter) {
      logger.error(`[AUTH] ACCESS DENIED | ${req.method} ${req.originalUrl} | token invalide ou session fermée`);
      return res.status(401).json({ erreur: 'Non autorisé' });
    }

// Session expirée
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      session.connecter = false;
      session.closed_at = nowParis(); 
      await session.save();
      logger.error(`[AUTH] ACCESS DENIED | ${req.method} ${req.originalUrl} | session expirée`);
      return res.status(401).json({ erreur: 'Session expirée' });
    }

// Gestion de l'erreur Sequelize si la FK est violée
    let compte = await Compte_Commercant.findByPk(session.id_compte); 
    if (!compte) { 
      logger.error(`[AUTH] ACCESS DENIED | ${req.method} ${req.originalUrl} | compte introuvable`); 
      return res.status(401).json({ erreur: 'Non autorisé' }); 
    }
    req.user = { 
      id_compte: compte.id_compte, 
      id_commercant: compte.id_commercant || null, 
      login: compte.login, 
      qualite: !!compte.qualite,
    };
    logger.info(`[AUTH] ACCESS GRANTED | ${req.method} ${req.originalUrl} | id_compte=${compte.id_compte}`); 
    next(); 
  } catch (err) { 
    logger.error(`[AUTH] ERROR | ${err.message}`); 
    res.status(500).json({ erreur: 'Erreur serveur' }); 
  } 
};

module.exports = authMiddleware;
// Ce code appartient à la société IDEAL SOLUTIONS 