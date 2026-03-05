const { DataTypes } = require('sequelize');
const sequelize = require('../db');  // Connexion à la base de données
const Categorie = require('./Categorie');

const Commercant = sequelize.define('Commercant', {
id_commercant: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  siret: {
    type: DataTypes.STRING(14),
    allowNull: false,
  },
    siren: {
    type: DataTypes.STRING(9),
    allowNull: false,
  },
    nom_commercial: {
    type: DataTypes.STRING,
    allowNull: false,
  },
    adresse: {
    type: DataTypes.STRING,
    allowNull: false,
  },
    code_postal: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
    ville: {
    type: DataTypes.STRING,
    allowNull: false,
  },
    telephone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
    email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
    site_web: {
    type: DataTypes.STRING,
    allowNull: true,
  },
    description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
    actif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
    image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
id_categorie: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
    model: 'CATEGORIE', 
    key: 'id_categorie'
    },
    
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT' 
  },

}, {
  timestamps: false,  // Évite d'ajouter une autre table dans la bdd Mamp
  tableName: 'COMMERCANT',
});

// Associations
Commercant.belongsTo(Categorie, { as: 'Categorie', foreignKey: 'id_categorie' });
Categorie.hasMany(Commercant, { foreignKey: 'id_categorie' });


module.exports = Commercant;
// Ce code appartient à la société IDEAL SOLUTIONS 