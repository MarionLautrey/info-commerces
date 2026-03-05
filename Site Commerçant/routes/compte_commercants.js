const express = require('express');
const router = express.Router();
const Compte_Commercant = require('../models/Compte_Commercant'); // importe le modèle de la table Compte_commercant
const Commercant = require('../models/Commercant'); // importe le modèle de la table Commercant
const crypto = require('crypto'); // permet le cryptage (pour le mot de passe notamment)
const authMiddleware = require('../middleware/authMiddleware');// middleware qui protège les routes compte_commercant (autorise uniquement les requêtes valides)
const logger = require('../logger'); // ajoute les logs

// Fonction pour loguer avec IP
function logAction(action, details, req) {
  let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
  logger.info(`[COMMERCANT] ${action} | ${details} | ip=${ip}`);
}

// Validation format date
function formatDate(date) {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0]; // YYYY-MM-DD
}

// Validation email pour qu'il soit adapté au bon format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Fonction de validation d'un mot de passe
function isValidPassword(pwd) {
  return typeof pwd === 'string'
    && pwd.length >= 12
    && /[A-Z]/.test(pwd)
    && /[a-z]/.test(pwd)
    && /\d/.test(pwd)
    && /[!@#$%^&*()_+\-=:]/.test(pwd);
}

// Lister tous les comptes commerçants
router.get('/', authMiddleware, async (req, res) => { // ajout authMiddleware pour restreindre l'accès
  try {
    let comptes;
    let isAdmin = req.user.qualite === true;

    if (isAdmin) {
// Admin voit tous les comptes
      comptes = await Compte_Commercant.findAll({
        include:[
        { model: Commercant, as: 'Commercant', attributes: ['nom_commercial'] },
        ]
      });
    } else {

// Utilisateur normal ne voit que son compte
  comptes = await Compte_Commercant.findAll({
      where: { id_compte: req.user.id_compte },
      include:[
        { model: Commercant, as: 'Commercant', attributes: ['nom_commercial'] },
      ]
    });
  }
    logAction('GET ALL', `count=${comptes.length}`, req);

// On formate la date_creation pour chaque compte
    let json = comptes.map(c => {
    let obj = c.toJSON();
    obj.date_creation = formatDate(obj.date_creation);
    delete obj.mot_de_passe;
    return obj;
  });
    res.json(json);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown'; // ajout IP pour le log d'erreur
    logger.error(`[COMPTE_COMMERCANT] GET ALL ERROR | ${err.message} | ip=${ip}`);   
    res.status(500).json({ erreur: err.message });
  }
});

// Route pour vérifier si un login existe déjà
router.get('/check-login', authMiddleware, async (req, res) => {
  try {
    let login = req.query.login;
    if (!login) return res.status(400).json({ erreur: "Login requis" });
    let compte = await Compte_Commercant.findOne({ where: { login } });
    res.json({ exists: !!compte });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Récupérer un compte par id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    let compte = await Compte_Commercant.findByPk(req.params.id);
    if (!compte){
      logAction('GET ONE FAILED', `id=${req.params.id}`, req);
      return res.status(404).json({ erreur: 'Compte non trouvé' });
    } 
    if (req.user.qualite !== true && compte.id_commercant !== req.user.id_commercant) {
      return res.status(403).json({ erreur: "Accès refusé" });
    }
    logAction('GET ONE', `id=${compte.id}`, req);
    let json = compte.toJSON();
    json.date_creation = formatDate(json.date_creation);
    delete json.mot_de_passe;
    res.json(json);
  } catch (err) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMPTE_COMMERCANT] GET ONE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Ajouter un compte commerçant
router.post('/', authMiddleware, async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent créer un compte
  try {
    let {login, mot_de_passe,email,qualite,id_commercant} = req.body;

// Vérification des champs obligatoires
    if (!login || !mot_de_passe || !email || !id_commercant) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMPTE_COMMERCANT] CREATE ERROR | Tous les champs doivent être remplis | ip=${ip}`);
      return res.status(400).json({ erreur: "Tous les champs(login, mot_de_passe,email,id_commercant) doivent être remplis" });
    }

// Validation login
    if (!login || login.trim() === '') {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMPTE_COMMERCANT] CREATE ERROR | login manquant | ip=${ip}`);
      return res.status(400).json({ erreur: "Le login est obligatoire" });
    }

// Vérifier si login existe déjà
    let loginExiste = await Compte_Commercant.findOne({ where: { login } });
    if (loginExiste) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMPTE_COMMERCANT] CREATE ERROR | login déjà utilisé | ip=${ip}`);
      return res.status(400).json({ erreur: "Ce login est déjà utilisé" });
    }

// Validation mot de passe
    if (!isValidPassword(mot_de_passe)) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMPTE_COMMERCANT] CREATE/UPDATE ERROR | mot_de_passe invalide | ip=${ip}`);
      return res.status(400).json({ erreur: "Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial" });
    }

// Cryptage du mot de passe    
    let salt = crypto.randomBytes(8).toString('hex');
    let hash = crypto.scryptSync(mot_de_passe, salt, 16).toString('hex');

// Validation email
    if (!isValidEmail(email)) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMPTE_COMMERCANT] CREATE ERROR | Email invalide | ip=${ip}`);
      return res.status(400).json({ erreur: "Email invalide" });
    }

// Valeur par défaut
    if (qualite === undefined) {
      qualite = false;
    }

// Validation qualite
    if (typeof qualite !== 'boolean') {
      return res.status(400).json({ erreur: "qualite doit être un booléen" });
    }

// Sécurité : seul un admin peut créer un admin
    if (qualite === true && req.user?.qualite !== true) {
      return res.status(403).json({ erreur: "Droits insuffisants pour créer un admin" });
    }

// Vérifier si l'id commercant existe
    let idCommercantNum = parseInt(id_commercant);
    if (isNaN(idCommercantNum)) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMPTE_COMMERCANT] CREATE ERROR | id_commercant invalide | ip=${ip}`);
      return res.status(400).json({ erreur: "id_commercant invalide" });
    }

// Gestion de l'erreur Sequelize si la FK est violée
    let commercant = await Commercant.findByPk(idCommercantNum);
    if (!commercant) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMPTE_COMMERCANT] CREATE ERROR | Le commerçant spécifié n'existe pas. id=${id_commercant} | ip=${ip}`);
      return res.status(400).json({ erreur: "Le commerçant spécifié n'existe pas." });
    }

// Création du compte lié au commerçant existant
    let nouveauCompte = await Compte_Commercant.create({login,mot_de_passe: hash + ':' + salt,email,qualite,date_creation: new Date(),id_commercant: idCommercantNum});
    let compteJson = nouveauCompte.toJSON();              
    compteJson.date_creation = formatDate(compteJson.date_creation); 
    delete compteJson.mot_de_passe; 
    logAction('CREATE', `id= ${nouveauCompte.id_compte},login= ${login}, email= ${email}, date_creation= ${nouveauCompte.date_creation}, id_commercant= ${idCommercantNum}`, req);
    res.json(compteJson);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      logger.error(`[COMPTE_COMMERCANT] CREATE ERROR | Le compte spécifié n'existe pas | ip=${ip}`);
      return res.status(400).json({ erreur: "Le compte spécifié n'existe pas." });
    }
    logger.error(`[COMPTE_COMMERCANT] CREATE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Modifier un compte commerçant
router.put('/:id', authMiddleware, async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent modifier un compte
  try {
    let { login, mot_de_passe, email, id_commercant, qualite } = req.body;
    let compte = await Compte_Commercant.findByPk(req.params.id);
    if (!compte) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMPTE_COMMERCANT] UPDATE ERROR | Compte non trouvé id=${req.params.id} | ip=${ip}`);
      return res.status(404).json({ erreur: 'Compte non trouvé' });
    } 

// Un commerçant ne peut modifier que son compte
    if (req.user.qualite !== true && compte.id_compte !== req.user.id_compte) {
      return res.status(403).json({ erreur: "Accès refusé" });
    }
    let modifications = [];

// Modifier le login (uniquement si admin)
if (login !== undefined) {
  if (req.user.qualite !== true) {
    return res.status(403).json({ erreur: "Modification du login interdite" });
  }
  if (login.trim() === '') return res.status(400).json({ erreur: "login invalide" });

// Vérifier si login existe déjà
  if (login !== compte.login) {
    const loginExiste = await Compte_Commercant.findOne({ where: { login } });
    if (loginExiste) {
      return res.status(400).json({ erreur: "Ce login est déjà utilisé" });
    }
  }
  modifications.push({ field: 'login', before: compte.login, after: login });
  compte.login = login;
}

// Modifier le mot de passe 
  if (mot_de_passe) {

// Validation du mot de passe
  if (!isValidPassword(mot_de_passe)) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[COMPTE_COMMERCANT] UPDATE ERROR | mot_de_passe invalide | ip=${ip}`);
    return res.status(400).json({ erreur: "Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial" 
    });
  }

// Cryptage du mot de passe
  let salt = crypto.randomBytes(8).toString('hex');
  let hash = crypto.scryptSync(mot_de_passe, salt, 16).toString('hex');
  compte.mot_de_passe = hash + ':' + salt;
}

// Modifier l'email 
    if (email !== undefined) {
      if (!isValidEmail(email)) return res.status(400).json({ erreur: "Email invalide" });
      modifications.push({ field: 'email', before: compte.email, after: email });
      compte.email = email;
    }

// Modifier la qualité (admin / non-admin)
  if (req.user?.qualite === true && qualite !== undefined) {
  if (typeof qualite !== 'boolean') {
    return res.status(400).json({ erreur: "qualite doit être un booléen" });
  }

  // Ne pas rétrograder un admin existant
  if (compte.qualite === true && qualite === false) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[COMPTE_COMMERCANT] RETROGRADE ADMIN INTERDIT | Tentative sur id=${compte.id_compte} | par admin id=${req.user.id_compte} | ip=${ip}`);
    return res.status(403).json({ erreur: "Impossible de rétrograder un administrateur" });
  }

  // Log promotion admin
  if (compte.qualite === false && qualite === true) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logAction(`[COMPTE_COMMERCANT] PROMOTION ADMIN | cible id=${compte.id_compte} (${compte.login}) | promu par admin id=${req.user.id_compte} (${req.user.login}) | ip=${ip}`);
  }
  compte.qualite = qualite;
}

// Modifier la date
    let json = compte.toJSON();
    json.date_creation = formatDate(json.date_creation);

// Modifier id_commercant si présent et valide
    if (id_commercant !== undefined) {
      let idCommercantNum = parseInt(id_commercant);
      if (isNaN(idCommercantNum)) { return res.status(400).json({ erreur: "id_commercant invalide" });}
      let commercant = await Commercant.findByPk(idCommercantNum);
      if (!commercant) { return res.status(400).json({ erreur: "Le commerçant spécifié n'existe pas." });}
      modifications.push({ field: 'id_commercant', before: compte.id_commercant, after: idCommercantNum });
      compte.id_commercant = idCommercantNum;
    }

// Vérifie qu'au moins un champ valide a été modifié
    if (modifications.length === 0) {
      let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
      logger.error(`[COMPTE_COMMERCANT] UPDATE ERROR | Aucun champ valide à modifier | ip=${ip}`);
      return res.status(400).json({ erreur: "Aucun champ valide fourni pour la modification" });
    }

// Sauvegarde les modifications d'un compte commerçant
    await compte.save();

// Log détaillé avec valeur avant/après
    let modificationDetails = modifications.map(m => `${m.field}: "${m.before}" -> "${m.after}"`).join(', ');
    logAction('UPDATE', `id=${compte.id_compte}, ${modificationDetails}`, req);
    res.json(json);
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[COMPTE_COMMERCANT] UPDATE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

// Supprimer un compte commerçant
router.delete('/:id', authMiddleware, async (req, res) => { // authMiddleware protège la route : seules les requêtes autorisées peuvent supprimer un compte
  try {
    let compte = await Compte_Commercant.findByPk(req.params.id);
    if (!compte) return res.status(404).json({ erreur: 'Compte non trouvé' });
    if (req.user.qualite !== true && compte.id_compte !== req.user.id_compte) {
      return res.status(403).json({ erreur: "Accès refusé" });
    }
    await compte.destroy();
    logAction('DELETE', `id=${req.params.id}`, req);
    res.json({ message: 'Compte commerçant supprimé', id: req.params.id });
  } catch (err) {
    let ip = req?.headers['x-forwarded-for']?.split(',').shift() || req?.ip || req?.socket?.remoteAddress || 'unknown';
    logger.error(`[COMPTE_COMMERCANT] DELETE ERROR | ${err.message} | ip=${ip}`);
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
// Ce code appartient à la société IDEAL SOLUTIONS