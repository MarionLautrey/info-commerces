const { DataTypes } = require('sequelize');
const sequelize = require('../db');  // Connexion à la base de données

const Categorie = sequelize.define('Categorie', {
id_categorie: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  libelle: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: false,  // Évite d'ajouter une autre table dans la bdd Mamp
  tableName: 'CATEGORIE',
});

module.exports = Categorie;
// Ce code appartient à la société IDEAL SOLUTIONS 