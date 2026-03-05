const { DataTypes } = require('sequelize');
const sequelize = require('../db');  // Connexion à la base de données
const Commercant = require('../models/Commercant'); // importe le modèle de la table Commercant

const Horaire = sequelize.define('Horaire', {
id_horaire: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
    jour: {
    type: DataTypes.STRING,
    allowNull: false,
  },

    heure_debut: {
    type: DataTypes.TIME,
    allowNull: true,
  },
    heure_fin: {
    type: DataTypes.TIME,
    allowNull: true,
  },
    ouverture: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
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
  tableName: 'HORAIRE',
});

// Associations
Horaire.belongsTo(Commercant, { as: 'Commercant', foreignKey: 'id_commercant' });
Commercant.hasMany(Horaire, { foreignKey: 'id_commercant', as: 'Horaire' });

module.exports = Horaire;
// Ce code appartient à la société IDEAL SOLUTIONS 