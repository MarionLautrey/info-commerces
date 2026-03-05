-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost:8889
-- Généré le : jeu. 05 fév. 2026 à 11:10
-- Version du serveur : 8.0.44
-- Version de PHP : 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `Projet`
--

-- --------------------------------------------------------

--
-- Structure de la table `ACTUALITE`
--

CREATE TABLE `ACTUALITE` (
  `id_actualite` int NOT NULL,
  `titre` text NOT NULL,
  `contenu` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `date_publication` date NOT NULL,
  `publie_facebook` varchar(50) NOT NULL,
  `publie_instagram` varchar(50) NOT NULL,
  `chemin_img` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `id_commercant` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `ACTUALITE`
--

INSERT INTO `ACTUALITE` (`id_actualite`, `titre`, `contenu`, `date_publication`, `publie_facebook`, `publie_instagram`, `chemin_img`, `id_commercant`) VALUES
(7, 'nouveau magasin', 'UI', '2026-01-21', 'oui', 'non', NULL, 21),
(13, 'la blachère', 'Bienvenue', '2026-01-28', '0', '0', 'commercant74_1769614578476.jpeg', 74),
(14, 'Test', 'text', '2026-02-05', '0', '0', 'commercant68_1770046698134.jpeg', 68),
(15, 'nouveau magasin', 'gez', '2026-01-26', '0', '0', 'commercant21_1769443579583.jpeg', 21),
(17, 'Nouveau magasin', 'ouverture', '2026-01-28', '0', '0', 'commercant41_1769419956834.jpeg', 41),
(20, 'nouveau magasin', 'ezf', '2026-02-03', '0', '0', 'commercant41_1770106787397.jpeg', 41),
(21, 'Test', 'Test', '2026-02-03', '0', '0', 'commercant41_1770107856964.jpeg', 41),
(22, 'L\'heure du jour', 'Heure du jour', '2026-02-03', '0', '0', 'commercant36_1770108434171.jpeg', 36),
(23, 'Fleuriste', 'Nouveau magasin fleuriste près de chez vous', '2026-02-03', '0', '0', 'commercant36_1770108467276.jpeg', 36),
(24, 'Juste histoire de dire', 'voila', '2026-02-03', '0', '0', NULL, 68),
(25, 'le dernier enfin !', 'youpi', '2026-02-03', '0', '0', 'commercant41_1770115369934.jpeg', 41),
(26, 'Parfait', 'Ouverture de notre magasin dès aujourd\'hui', '2026-02-04', '0', '0', 'commercant41_1770212050579.jpeg', 41),
(27, 'Parfait', 'Bienvenue dans le magasin Parfait', '2026-02-04', '0', '0', 'commercant82_1770212471539.jpeg', 82);

-- --------------------------------------------------------

--
-- Structure de la table `CATEGORIE`
--

CREATE TABLE `CATEGORIE` (
  `id_categorie` int NOT NULL,
  `libelle` varchar(50) NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `CATEGORIE`
--

INSERT INTO `CATEGORIE` (`id_categorie`, `libelle`, `description`) VALUES
(4, 'patisserie', 'good'),
(6, 'bar', 'convivial'),
(9, 'crêperies', 'bonne crêpe au nutella'),
(10, 'radio', 'Notre friperie est ouverte'),
(13, 'friperie', ' friperie est ouverte , welcome'),
(14, 'boulangerie', 'la boulangerie est ouverte'),
(62, 'Parfait', '');

-- --------------------------------------------------------

--
-- Structure de la table `COMMERCANT`
--

CREATE TABLE `COMMERCANT` (
  `id_commercant` int NOT NULL,
  `siret` varchar(14) NOT NULL,
  `siren` varchar(9) NOT NULL,
  `nom_commercial` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `adresse` varchar(50) NOT NULL,
  `code_postal` varchar(5) NOT NULL,
  `ville` varchar(50) NOT NULL,
  `telephone` varchar(10) NOT NULL,
  `email` varchar(50) NOT NULL,
  `site_web` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text NOT NULL,
  `actif` tinyint(1) NOT NULL,
  `image` varchar(100) DEFAULT NULL,
  `id_categorie` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `COMMERCANT`
--

INSERT INTO `COMMERCANT` (`id_commercant`, `siret`, `siren`, `nom_commercial`, `adresse`, `code_postal`, `ville`, `telephone`, `email`, `site_web`, `description`, `actif`, `image`, `id_categorie`) VALUES
(21, '12345789963250', '111111111', 'petit paris', '2 Rue de la vilette', '12001', 'Paris', '0385725898', 'leona@exemple.fr', 'https:/tleptitparis.com', 'Bienvenue dans leptitparis', 0, NULL, 4),
(36, '01234567899874', '111111110', 'ah', '2 Rue de la paix', '38750', 'Paris', '0385789820', 'test@exemple.fr', NULL, 'ajour', 0, 'commercant41_1770135158566.jpeg', 6),
(41, '01236547896452', '123456789', 'leona', '10 Rue de la fayette', '12001', 'New York', '0950807412', 'letestencore@laposte.net', 'https://letestencore.fr', 'test', 0, 'commercant21_1769524047052.jpeg', 9),
(52, '01236547896452', '147896523', 'test', '2 rue de paris', '01011', 'Tokyo', '1122334450', 'leona@example.com', 'https://leona.tests', 'test', 0, 'commercant21_1769507198073.jpeg', 4),
(68, '01236547896452', '102365478', 'LetestEncore', '3 boulevard de la Vilette', '12001', 'Paris', '0205040708', 'lefameuxtest@orange.fr', NULL, 'test', 0, 'commercant68_1769604277857.jpeg', 6),
(74, '01236547896452', '236598741', 'La Blachère', '2 impasse de chalon', '71100', 'Chalon', '0385789658', 'lablachère@example.com', 'https://lablachère.tests', 'bienvenue', 1, 'commercant21_1769441935531.jpeg', 9),
(76, '01236547896425', '333666555', 'NRJ', '10 Rue de la fayette', '25896', 'Lyon', '0325896547', 'nrj@orange.fr', NULL, 'Njr it music only', 1, 'commercant41_1770108905374.jpeg', 10),
(77, '025874136987', '111111111', 'Jsp', '2 Rue du boulevard', '38750', 'Paris', '0245789635', 'jsp@exemple.net', NULL, 'jsp', 0, NULL, 13),
(78, '02587413698702', '000222589', 'Orange', '3 boulevard de la Vilette', '78956', 'Paris', '0205080704', 'orange@orange.fr', '', 'Bienvenue chez orange', 1, NULL, 13),
(79, '123025874962', '147885522', 'Carrefour', '2 Rue de la paix', '71000', 'Chalon', '0385902081', 'carrefour@test.fr', '', 'Bienvenue dans votre magasin carrefour', 1, NULL, 13),
(80, '3698745120213', '213654789', 'Plus', '2 Rue de la paix', '71001', 'Lyon', '0385258754', 'plus@test.com', '', 'plus', 0, 'commercant41_1770123113682.jpeg', 13),
(81, '01236547896452', '000222589', 'La Blachère', '2 rue de paris', '38750', 'Tokyo', '1122334450', 'letest@laposte.net', 'https://lablachère.tests', 'uvbuj', 1, 'commercant41_1770216907695.jpeg', 4),
(82, '01236547896452', '000222589', 'Parfait', '2 impasse de chalon', '71100', 'Chalon', '0205040708', 'parfait@test.fr', 'https:/parfait.fr', 'Bienvenue dans votre magasin Parfait', 1, 'commercant41_1770211896387.jpeg', 62);

-- --------------------------------------------------------

--
-- Structure de la table `COMPTE_COMMERCANT`
--

CREATE TABLE `COMPTE_COMMERCANT` (
  `id_compte` int NOT NULL,
  `login` varchar(50) NOT NULL,
  `mot_de_passe` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(50) NOT NULL,
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `qualite` tinyint(1) NOT NULL DEFAULT '0',
  `id_commercant` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `COMPTE_COMMERCANT`
--

INSERT INTO `COMPTE_COMMERCANT` (`id_compte`, `login`, `mot_de_passe`, `email`, `date_creation`, `qualite`, `id_commercant`) VALUES
(26, 'test', '328e4df74797d5db08b31a551fabe72a:af867c9a71a5014b', 'test@example.com', '2026-01-07 13:34:24', 0, 52),
(49, 'leona', '36426a655fd9e03317659c10866ca714:8999fb50f59a0b13', 'leona@test.com', '2026-01-22 10:01:34', 1, 41),
(55, 'leona1', '646f144a98db0d6baeda760869ac0892:9c39ae5bceb621c8', 'leona@example.com', '2026-01-27 13:49:24', 1, 41),
(57, 'lablachère', '085f6e2b7aabe51d56a1c02278811f74:e6709cd391b495cc', 'lablachère@example.com', '2026-01-27 13:52:09', 0, 74),
(62, 'letest', 'df92c3234048706473bd74cd6b5b7395:5baab144bedcd8e8', 'letest@laposte.net', '2026-01-28 10:33:33', 0, 68),
(63, 'ter', '35552d9b0c34f58ce10a108b79542666:59684228edc70642', 'ah@exemple.fr', '2026-01-28 10:37:04', 0, 36),
(73, 'letest12', '90f5a9f42117ff32a0ba75b8470561c7:2db672390bc8f3e8', 'letest@laposte.net', '2026-01-30 08:37:50', 0, 36),
(74, 'letest30', 'c92f9491899819dc6c8b4442339e616f:33a8c34ac0be51d9', 'letest@laposte.net', '2026-02-02 07:49:09', 0, 21),
(75, 'test12', '9ff0d74c1a55d5ae10a997539beb41c7:3b75d353b4d13c00', 'letest@laposte.net', '2026-02-02 12:48:21', 0, 36),
(76, 'leona12', '5b6a02998c1b2e83903db68ceaf17f5e:2a3fce99c93c5c52', 'leona@example.com', '2026-02-02 13:50:06', 0, 41),
(77, 'letest125', '1cced5a94419f667ea82cf91bdecb141:bb91be0b540bc691', 'letestencore@laposte.net', '2026-02-02 13:50:22', 0, 68),
(78, 'letest205', 'cad3b270b1a01cdb0226a613bc5d58ae:737289fff5c87519', 'leona@example.com', '2026-02-03 10:19:30', 0, 21),
(79, 'Parfait', 'b254093d080b47f01fae4d4358271567:7374b20770380fdb', 'parfait@test.fr', '2026-02-04 13:34:55', 0, 82);

-- --------------------------------------------------------

--
-- Structure de la table `HORAIRE`
--

CREATE TABLE `HORAIRE` (
  `id_horaire` int NOT NULL,
  `jour` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `heure_debut` time DEFAULT NULL,
  `heure_fin` time DEFAULT NULL,
  `ouverture` tinyint(1) NOT NULL,
  `id_commercant` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `HORAIRE`
--

INSERT INTO `HORAIRE` (`id_horaire`, `jour`, `heure_debut`, `heure_fin`, `ouverture`, `id_commercant`) VALUES
(1001, 'lundi', '16:00:00', '19:00:00', 1, 52),
(1002, 'mardi', '17:30:00', '21:30:00', 1, 52),
(1003, 'mercredi', NULL, NULL, 0, 52),
(1004, 'jeudi', NULL, NULL, 0, 52),
(1005, 'vendredi', NULL, NULL, 0, 52),
(1006, 'samedi', NULL, NULL, 0, 52),
(1007, 'dimanche', '11:30:00', '17:30:00', 1, 52),
(1022, 'lundi', '10:40:00', '15:40:00', 1, 21),
(1023, 'mardi', NULL, NULL, 0, 21),
(1024, 'mercredi', NULL, NULL, 0, 21),
(1025, 'jeudi', '19:56:00', '23:56:00', 1, 21),
(1026, 'vendredi', NULL, NULL, 0, 21),
(1027, 'samedi', NULL, NULL, 0, 21),
(1028, 'dimanche', NULL, NULL, 0, 21),
(1057, 'lundi', '10:30:00', '15:45:00', 1, 41),
(1058, 'mardi', '21:30:00', '22:30:00', 1, 41),
(1059, 'mercredi', '16:30:00', '20:30:00', 1, 41),
(1060, 'jeudi', NULL, NULL, 0, 41),
(1061, 'vendredi', NULL, NULL, 0, 41),
(1062, 'samedi', NULL, NULL, 0, 41),
(1063, 'dimanche', NULL, NULL, 0, 41),
(1071, 'lundi', '10:55:00', '15:55:00', 1, 76),
(1072, 'mardi', NULL, NULL, 0, 76),
(1073, 'mercredi', NULL, NULL, 0, 76),
(1074, 'jeudi', NULL, NULL, 0, 76),
(1075, 'vendredi', NULL, NULL, 0, 76),
(1076, 'samedi', NULL, NULL, 0, 76),
(1077, 'dimanche', NULL, NULL, 0, 76),
(1106, 'lundi', NULL, NULL, 0, 78),
(1107, 'mardi', NULL, NULL, 0, 78),
(1108, 'mercredi', NULL, NULL, 0, 78),
(1109, 'jeudi', NULL, NULL, 0, 78),
(1110, 'vendredi', NULL, NULL, 0, 78),
(1111, 'samedi', NULL, NULL, 0, 78),
(1112, 'dimanche', NULL, NULL, 0, 78),
(1113, 'lundi', NULL, NULL, 0, 79),
(1114, 'mardi', NULL, NULL, 0, 79),
(1115, 'mercredi', NULL, NULL, 0, 79),
(1116, 'jeudi', NULL, NULL, 0, 79),
(1117, 'vendredi', NULL, NULL, 0, 79),
(1118, 'samedi', NULL, NULL, 0, 79),
(1119, 'dimanche', NULL, NULL, 0, 79),
(1120, 'lundi', NULL, NULL, 0, 80),
(1121, 'mardi', NULL, NULL, 0, 80),
(1122, 'mercredi', NULL, NULL, 0, 80),
(1123, 'jeudi', '12:00:00', '22:00:00', 1, 80),
(1124, 'vendredi', NULL, NULL, 0, 80),
(1125, 'samedi', NULL, NULL, 0, 80),
(1126, 'dimanche', NULL, NULL, 0, 80),
(1134, 'lundi', '17:40:00', '22:40:00', 1, 74),
(1135, 'mardi', '17:00:00', '20:30:00', 1, 74),
(1136, 'mercredi', NULL, NULL, 0, 74),
(1137, 'jeudi', NULL, NULL, 0, 74),
(1138, 'vendredi', NULL, NULL, 0, 74),
(1139, 'samedi', NULL, NULL, 0, 74),
(1140, 'dimanche', NULL, NULL, 0, 74),
(1162, 'lundi', NULL, NULL, 0, 77),
(1163, 'mardi', '15:10:00', '20:10:00', 1, 77),
(1164, 'mercredi', NULL, NULL, 0, 77),
(1165, 'jeudi', NULL, NULL, 0, 77),
(1166, 'vendredi', NULL, NULL, 0, 77),
(1167, 'samedi', NULL, NULL, 0, 77),
(1168, 'dimanche', NULL, NULL, 0, 77),
(1204, 'lundi', '15:30:00', '20:30:00', 1, 82),
(1205, 'mardi', '15:30:00', '20:30:00', 1, 82),
(1206, 'mercredi', '15:30:00', '20:30:00', 1, 82),
(1207, 'jeudi', '15:30:00', '20:30:00', 1, 82),
(1208, 'vendredi', '15:30:00', '23:30:00', 1, 82),
(1209, 'samedi', '09:30:00', '16:30:00', 1, 82),
(1210, 'dimanche', NULL, NULL, 0, 82),
(1211, 'lundi', '16:30:00', '20:45:00', 1, 81),
(1212, 'mardi', NULL, NULL, 0, 81),
(1213, 'mercredi', NULL, NULL, 0, 81),
(1214, 'jeudi', NULL, NULL, 0, 81),
(1215, 'vendredi', NULL, NULL, 0, 81),
(1216, 'samedi', NULL, NULL, 0, 81),
(1217, 'dimanche', NULL, NULL, 0, 81),
(1218, 'lundi', '12:30:00', '17:30:00', 1, 36),
(1219, 'mardi', NULL, NULL, 0, 36),
(1220, 'mercredi', NULL, NULL, 0, 36),
(1221, 'jeudi', NULL, NULL, 0, 36),
(1222, 'vendredi', NULL, NULL, 0, 36),
(1223, 'samedi', NULL, NULL, 0, 36),
(1224, 'dimanche', '12:00:00', '22:00:00', 1, 36),
(1232, 'lundi', '21:50:00', '22:50:00', 1, 68),
(1233, 'mardi', NULL, NULL, 0, 68),
(1234, 'mercredi', '12:50:00', '17:00:00', 1, 68),
(1235, 'jeudi', '16:00:00', '23:45:00', 1, 68),
(1236, 'vendredi', NULL, NULL, 0, 68),
(1237, 'samedi', NULL, NULL, 0, 68),
(1238, 'dimanche', NULL, NULL, 0, 68);

-- --------------------------------------------------------

--
-- Structure de la table `RESEAU_SOCIAL`
--

CREATE TABLE `RESEAU_SOCIAL` (
  `id_reseau` int NOT NULL,
  `type` varchar(50) NOT NULL,
  `token_access` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `date_autorisation` date NOT NULL,
  `id_commercant` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `RESEAU_SOCIAL`
--

INSERT INTO `RESEAU_SOCIAL` (`id_reseau`, `type`, `token_access`, `date_autorisation`, `id_commercant`) VALUES
(2, 'facebook', '123456', '2026-02-06', 1),
(3, 'facebook', '123456', '2026-02-06', 1),
(5, 'facebook', 'thrjrjrt', '2026-02-06', 1),
(6, 'facebook', 'thrjrjrt', '2026-02-06', 2),
(7, 'facebook', 'thrjrjrt', '2026-02-06', 2),
(11, 'facebook', 'thrjrjrt', '2026-02-06', 1),
(12, 'facebook', 'thrjrjrt', '2026-02-06', 1),
(13, 'facebook', 'geegz', '2026-02-06', 1),
(14, 'facebook', 'geegz', '2026-02-06', 1);

-- --------------------------------------------------------

--
-- Structure de la table `SESSION`
--

CREATE TABLE `SESSION` (
  `id_session` int NOT NULL,
  `connecter` tinyint(1) NOT NULL,
  `token` varchar(50) NOT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `id_compte` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `SESSION`
--

INSERT INTO `SESSION` (`id_session`, `connecter`, `token`, `expires_at`, `closed_at`, `id_compte`) VALUES
(10, 0, '4e52133bcdaf00b857e60117280f705d', '2026-02-05 08:08:48', NULL, 26),
(12, 1, '2a19ea9d76ab1302e8e21130ffc503e3', '2026-02-06 10:48:39', NULL, 49),
(16, 0, '989ee17ccbe8caed15f46e40a8f79c33', '2026-02-05 08:08:48', NULL, 55),
(18, 0, '51d4883b9de87d024070ab60d57b51bb', '2026-02-05 08:08:48', NULL, 57),
(21, 1, 'c9173a0569402075c5108703304f31fb', '2026-02-06 10:54:25', NULL, 62),
(25, 0, 'e399b3ca68329668d6bd2a72708e0d9f', '2026-02-05 08:08:48', NULL, 73),
(26, 0, '5956b15aed804561249a9c43e652a9ea', '2026-02-05 08:08:48', NULL, 74),
(27, 0, '38d28aa4ecaed33047755388cbbe08b1', '2026-02-05 08:08:48', NULL, 75),
(28, 0, 'ae74197a1020bc189b28b4309d72b1fe', '2026-02-05 08:08:48', NULL, 63),
(29, 0, '6ea9d2840f5b3d93aa1044bcec119087', '2026-02-05 08:08:48', NULL, 79);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `ACTUALITE`
--
ALTER TABLE `ACTUALITE`
  ADD PRIMARY KEY (`id_actualite`),
  ADD KEY `id_commercant` (`id_commercant`);

--
-- Index pour la table `CATEGORIE`
--
ALTER TABLE `CATEGORIE`
  ADD PRIMARY KEY (`id_categorie`);

--
-- Index pour la table `COMMERCANT`
--
ALTER TABLE `COMMERCANT`
  ADD PRIMARY KEY (`id_commercant`),
  ADD KEY `fk_id_categorie` (`id_categorie`);

--
-- Index pour la table `COMPTE_COMMERCANT`
--
ALTER TABLE `COMPTE_COMMERCANT`
  ADD PRIMARY KEY (`id_compte`),
  ADD KEY `id_commercant` (`id_commercant`) USING BTREE;

--
-- Index pour la table `HORAIRE`
--
ALTER TABLE `HORAIRE`
  ADD PRIMARY KEY (`id_horaire`),
  ADD KEY ` id_commercant` (`id_commercant`);

--
-- Index pour la table `RESEAU_SOCIAL`
--
ALTER TABLE `RESEAU_SOCIAL`
  ADD PRIMARY KEY (`id_reseau`),
  ADD KEY `id_commercant` (`id_commercant`) USING BTREE;

--
-- Index pour la table `SESSION`
--
ALTER TABLE `SESSION`
  ADD PRIMARY KEY (`id_session`),
  ADD KEY `id_compte` (`id_compte`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `ACTUALITE`
--
ALTER TABLE `ACTUALITE`
  MODIFY `id_actualite` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT pour la table `CATEGORIE`
--
ALTER TABLE `CATEGORIE`
  MODIFY `id_categorie` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT pour la table `COMMERCANT`
--
ALTER TABLE `COMMERCANT`
  MODIFY `id_commercant` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=83;

--
-- AUTO_INCREMENT pour la table `COMPTE_COMMERCANT`
--
ALTER TABLE `COMPTE_COMMERCANT`
  MODIFY `id_compte` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=80;

--
-- AUTO_INCREMENT pour la table `HORAIRE`
--
ALTER TABLE `HORAIRE`
  MODIFY `id_horaire` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1239;

--
-- AUTO_INCREMENT pour la table `RESEAU_SOCIAL`
--
ALTER TABLE `RESEAU_SOCIAL`
  MODIFY `id_reseau` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT pour la table `SESSION`
--
ALTER TABLE `SESSION`
  MODIFY `id_session` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `COMMERCANT`
--
ALTER TABLE `COMMERCANT`
  ADD CONSTRAINT `fk_id_categorie` FOREIGN KEY (`id_categorie`) REFERENCES `categorie` (`id_categorie`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Contraintes pour la table `HORAIRE`
--
ALTER TABLE `HORAIRE`
  ADD CONSTRAINT `horaire_ibfk` FOREIGN KEY (`id_commercant`) REFERENCES `commercant` (`id_commercant`) ON DELETE CASCADE ON UPDATE RESTRICT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
