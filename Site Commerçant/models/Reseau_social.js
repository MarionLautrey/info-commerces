const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Commercant = require('../models/Commercant'); // importe le modèle de la table Commercant

const Reseau_social = sequelize.define('Reseau_social', {
  id_reseau: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  token_access: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date_autorisation: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  id_commercant: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Commercant, 
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT' 
  },
}, {
  timestamps: false, // Évite d'ajouter une autre table dans la bdd Mamp
  tableName: 'Reseau_social',
});

module.exports = Reseau_social;
// Ce code appartient à la société IDEAL SOLUTIONS 