const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  fields: {
    titre_avec_lien_vers_le_catalogue: String,
    auteur: String
  },
  available: { type: Boolean, default: true },
  borrower: { type: String, default: null }
});

module.exports = mongoose.model('Document', documentSchema);