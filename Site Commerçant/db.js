// Connexion à la base de donnée
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('Projet', 'root', 'root', {
  host: 'localhost',
  dialect: 'mysql', 
  port: 3306,  
});

module.exports = sequelize;
// Ce code appartient à la société IDEAL SOLUTIONS
