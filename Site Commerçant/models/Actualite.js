const { DataTypes } = require('sequelize');
const sequelize = require('../db');  // Connexion à la base de données
const Commercant = require('../models/Commercant'); // importe le modèle de la table Commercant

const Actualite = sequelize.define('Actualite', {
id_actualite: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titre: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
    contenu: {
    type: DataTypes.STRING,
    allowNull: false,
  },
    date_publication: {
    type: DataTypes.DATE,
    allowNull: false,
  },
    publie_facebook: {
    type: DataTypes.STRING,
    allowNull: false,
  },
    publie_instagram: {
    type: DataTypes.STRING,
    allowNull: false,
  },
    chemin_img: {
    type: DataTypes.STRING,
    allowNull: true,
  },
    id_commercant: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Commercant, // Référence au modèle Sequelize, pas au nom en string
      key: 'id_commercant'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT' // empêche de supprimer un commerçant utilisé
  },
}, {
  timestamps: false,  // Évite d'ajouter une autre table dans la bdd Mamp
  tableName: 'ACTUALITE', // indique la table à laquelle il a accès
});

// Associations
Actualite.belongsTo(Commercant, { as: 'Commercant', foreignKey: 'id_commercant' });
Commercant.hasMany(Actualite, { foreignKey: 'id_commercant', as: 'Actualite' });

module.exports = Actualite;
// Ce code appartient à la société IDEAL SOLUTIONS 