// Permet de hash les mot de passe s'ils sont saisis directement depuis la base de donnée
const Compte_Commercant = require('./models/Compte_Commercant'); 
const crypto = require('crypto');

async function hashPasswords() {
  const comptes = await Compte_Commercant.findAll();

  for (let compte of comptes) {
    if (!compte.mot_de_passe.includes(':')) {
      let mot_de_passe_clair = compte.mot_de_passe; 
      let salt = crypto.randomBytes(8).toString('hex');
      let hash = crypto.scryptSync(mot_de_passe_clair, salt, 16).toString('hex');
      compte.mot_de_passe = hash + ':' + salt;
      await compte.save();
      console.log(`Mot de passe hashé pour ${compte.login}`);
    }
  }

  console.log('Tous les mots de passe ont été hashés ');
  process.exit();
}

hashPasswords().catch(err => console.error(err));
// Ce code appartient à la société IDEAL SOLUTIONS