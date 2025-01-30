const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const User = require('../models/User');
const ensureAuthenticated = require('../middleware/auth');

// Afficher le profil de l'utilisateur
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const documents = await Document.find({ borrower: req.session.user.username });
    const user = await User.findById(req.session.user._id);
    const remainingBorrows = 5 - user.borrowedCount;
    res.render('profile', { title: 'Profil Utilisateur', documents, remainingBorrows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;