const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const ensureAuthenticated = require('../middleware/auth');

// Afficher la page de connexion utilisateur
router.get('/login', (req, res) => {
  res.render('login', { title: 'Connexion', error: null });
});

// Gérer la connexion utilisateur
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).render('index', { title: 'Accueil', error: 'Utilisateur non trouvé' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).render('index', { title: 'Accueil', error: 'Mot de passe incorrect' });
    }

    req.session.user = user;
    return res.redirect('/documents');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Afficher la page de connexion administrateur
router.get('/admin-login', (req, res) => {
  res.render('admin-login', { title: 'Connexion Administrateur', error: null });
});

// Gérer la connexion administrateur
router.post('/admin-login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, isAdmin: true });
    if (!user) {
      return res.status(400).render('admin-login', { title: 'Connexion Administrateur', error: 'Administrateur non trouvé' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).render('admin-login', { title: 'Connexion Administrateur', error: 'Mot de passe incorrect' });
    }

    req.session.user = user;
    return res.redirect('/admin');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Afficher la page d'inscription utilisateur
router.get('/register', (req, res) => {
  res.render('register', { title: 'Inscription', error: null });
});

// Gérer l'inscription utilisateur
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).render('register', { title: 'Inscription', error: 'Nom d\'utilisateur déjà pris' });
    }

    // Hasher le mot de passe avant de l'enregistrer
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });

    await newUser.save();
    res.redirect('login'); // Rediriger vers la page de connexion après inscription
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Déconnexion
router.get('/logout', ensureAuthenticated, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    res.redirect('/');
  });
});

module.exports = router;