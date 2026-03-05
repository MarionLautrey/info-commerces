const { DataTypes } = require('sequelize');
const sequelize = require('../db');  // Connexion à la base de données
const Commercant = require('../models/Commercant'); // importe le modèle de la table Commercant

const Compte_Commercant = sequelize.define('Compte_Commercant', {
id_compte: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
    login: {
    type: DataTypes.STRING,
    allowNull: false,
  },

    mot_de_passe: {
    type: DataTypes.STRING,
    allowNull: false,
  },
    email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
    date_creation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },

    qualite: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

    id_commercant: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Commercant, 
      key: 'id_commercant'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT' 
  },
}, {
  timestamps: false,  // Évite d'ajouter une autre table dans la bdd Mamp
  tableName: 'COMPTE_COMMERCANT',
});

// Associations
Compte_Commercant.belongsTo(Commercant, { as: 'Commercant', foreignKey: 'id_commercant' });
Commercant.hasMany(Compte_Commercant, { foreignKey: 'id_commercant', as: 'Compte_Commercant' });

module.exports = Compte_Commercant;
// Ce code appartient à la société IDEAL SOLUTIONS 