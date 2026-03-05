const { DataTypes } = require('sequelize');
const sequelize = require('../db');  // Connexion à la base de données
const Compte_Commercant = require('./Compte_Commercant'); // importe le modèle de la table Compte commerçant

const Session = sequelize.define('Session', {
id_session: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  connecter: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false, 
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
  },  
  expires_at: {
  type: DataTypes.DATE,
  allowNull: false,
},
  closed_at: {          
    type: DataTypes.DATE,
    allowNull: true,
  },
  id_compte: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Compte_Commercant,
      key: 'id_compte'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT' 
  },
}, {
  timestamps: false,  // Évite d'ajouter une autre table dans la bdd Mamp
  tableName: 'SESSION',
});

module.exports = Session;
// Ce code appartient à la société IDEAL SOLUTIONS 