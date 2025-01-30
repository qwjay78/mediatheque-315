const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const User = require('../models/User');
const ensureAuthenticated = require('../middleware/auth');

// Afficher les documents
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const search = req.query.search || '';
    const filter = req.query.filter || 'all';

    let documents = await Document.find({
      'fields.titre_avec_lien_vers_le_catalogue': { $regex: search, $options: 'i' }
    });

    let userDocuments = [];
    let borrowedDocuments = [];
    let availableDocuments = [];

    if (filter === 'my') {
      userDocuments = documents.filter(doc => doc.borrower === req.session.user.username);
    } else if (filter === 'borrowed') {
      borrowedDocuments = documents.filter(doc => !doc.available && doc.borrower !== req.session.user.username);
    } else if (filter === 'available') {
      availableDocuments = documents.filter(doc => doc.available);
    } else {
      userDocuments = documents.filter(doc => doc.borrower === req.session.user.username);
      borrowedDocuments = documents.filter(doc => !doc.available && doc.borrower !== req.session.user.username);
      availableDocuments = documents.filter(doc => doc.available);
    }

    const sortedDocuments = [...userDocuments, ...borrowedDocuments, ...availableDocuments];

    const user = await User.findById(req.session.user._id);
    const remainingBorrows = 5 - user.borrowedCount;

    res.render('documents', { title: 'Liste des documents', documents: sortedDocuments, search, filter, remainingBorrows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Emprunter un document
router.post('/borrow/:id', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (user.borrowedCount >= 5) {
      return res.status(400).json({ message: 'Vous avez atteint la limite de 5 livres empruntés' });
    }

    const document = await Document.findById(req.params.id);
    if (document.available) {
      document.available = false;
      document.borrower = req.session.user.username;
      await document.save();

      user.borrowedCount += 1;
      await user.save();

      res.redirect('/documents');
    } else {
      res.status(400).json({ message: 'Document déjà emprunté' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Retourner un document
router.post('/return/:id', ensureAuthenticated, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document.available && document.borrower === req.session.user.username) {
      document.available = true;
      document.borrower = null;
      await document.save();

      const user = await User.findById(req.session.user._id);
      user.borrowedCount -= 1;
      await user.save();

      res.redirect('/documents');
    } else {
      res.status(400).json({ message: 'Document déjà disponible ou non emprunté par vous' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route pour les suggestions de recherche
router.get('/suggestions', ensureAuthenticated, async (req, res) => {
  try {
    const search = req.query.search || '';
    const suggestions = await Document.find({
      'fields.titre_avec_lien_vers_le_catalogue': { $regex: search, $options: 'i' }
    }).limit(5);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;