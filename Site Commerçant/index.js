const express = require('express');
const app = express();
const port = 3000;
const sequelize = require('./db');
app.set('trust proxy', true);
const path = require('path');

// Ajout des routes requises
const categoriesRoutes = require('./routes/categories');
const commercantsRoutes = require('./routes/commercants');
const horairesRoutes = require('./routes/horaires');
const actualitesRoutes = require('./routes/actualites');
const reseau_socialsRoutes = require('./routes/reseau_socials');
const compte_commercantsRoutes = require('./routes/compte_commercants');
const sessionsRoutes = require('./routes/sessions');
const authRoutes = require('./routes/auth');
const logoutRouter = require('./routes/logout');

// Utilisation des routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/categories', categoriesRoutes);
app.use('/commercants', commercantsRoutes);
app.use('/horaires', horairesRoutes);
app.use('/actualites', actualitesRoutes);
app.use('/reseau_socials', reseau_socialsRoutes);
app.use('/compte_commercants', compte_commercantsRoutes);
app.use('/sessions', sessionsRoutes);
app.use('/auth', authRoutes);
app.use('/logout', logoutRouter);
app.use(express.static('public'));
app.use('/actualite/images', express.static(path.join(__dirname, 'actualite/images')));
app.use('/commercant/images', express.static(path.join(__dirname, 'commercant/images')));

// Connexion et synchronisation Sequelize
(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connecté à MySQL via Sequelize !');
    } catch (err) {
        console.error('Erreur Sequelize :', err);
    }
})();

app.listen(port, () => {
    console.log(`Serveur lancé sur http://localhost:${port}`);
});

// Ce code appartient à la société IDEAL SOLUTIONS