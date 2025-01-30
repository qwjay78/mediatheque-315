const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Document = require('../models/Document');
const ensureAuthenticated = require('../middleware/auth');

// Middleware pour vérifier si l'utilisateur est admin
function ensureAdmin(req, res, next) {
  if (req.session.user && req.session.user.isAdmin) {
    next();
  } else {
    res.status(403).send('Accès refusé');
  }
}
// Ajouter cette fonction helper en haut du fichier
async function recalculateUserBorrowCount(username) {
  const user = await User.findOne({ username });
  if (user) {
    const borrowedDocs = await Document.countDocuments({ 
      borrower: username,
      available: false 
    });
    user.borrowedCount = borrowedDocs;
    await user.save();
  }
}

// Modifier la route existante
router.post('/documents/return/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (document) {
      const username = document.borrower;
      document.available = true;
      document.borrower = null;
      await document.save();
      
      // Recalculer le nombre d'emprunts
      await recalculateUserBorrowCount(username);
    }
    res.redirect('/admin/documents');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Afficher le tableau de bord admin
router.get('/', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.render('dashboard', { title: 'Tableau de bord Admin', users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Afficher la liste des utilisateurs
router.get('/users', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const search = req.query.search || '';
    const filter = req.query.filter || 'all';

    let users = await User.find({
      username: { $regex: search, $options: 'i' }
    });

    if (filter === 'admin') {
      users = users.filter(user => user.isAdmin);
    } else if (filter === 'user') {
      users = users.filter(user => !user.isAdmin);
    }

    // Passer success, search et filter dans la vue
    res.render('users', { 
      title: 'Gestion des utilisateurs', 
      users, 
      search, 
      filter,
      success: req.query.success // Passer la variable de succès
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Ajouter un utilisateur
router.post('/users/add', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { username, password, isAdmin } = req.body;
    const newUser = new User({ username, password, isAdmin: isAdmin === 'on' });
    await newUser.save();
    res.redirect('/admin/users');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Supprimer un utilisateur
router.post('/users/delete/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    // Passer un message de succès avec la redirection
    res.redirect('/admin/users?success=Utilisateur supprimé');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Afficher la liste des documents
router.get('/documents', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const search = req.query.search || '';
    const filter = req.query.filter || 'all';

    let documents = await Document.find({
      'fields.titre_avec_lien_vers_le_catalogue': { $regex: search, $options: 'i' }
    });

    if (filter === 'borrowed') {
      documents = documents.filter(doc => !doc.available);
    } else if (filter === 'available') {
      documents = documents.filter(doc => doc.available);
    }

    res.render('admin-documents', { title: 'Gestion des documents', documents, search, filter });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ajouter un document
router.post('/documents/add', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { titre_avec_lien_vers_le_catalogue, auteur } = req.body;
    const newDocument = new Document({ fields: { titre_avec_lien_vers_le_catalogue, auteur } });
    await newDocument.save();
    res.redirect('/admin/documents');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Annuler l'emprunt d'un document
router.post('/documents/return/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (document) {
      // Trouver l'utilisateur qui avait emprunté le document
      const user = await User.findOne({ username: document.borrower });
      if (user) {
        user.borrowedCount = Math.max(0, user.borrowedCount - 1);
        await user.save();
      }
      
      document.available = true;
      document.borrower = null;
      await document.save();
    }
    res.redirect('/admin/documents');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
