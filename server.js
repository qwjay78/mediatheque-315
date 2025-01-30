const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const documentsRouter = require('./routes/documents');
const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const adminRouter = require('./routes/admin');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Utiliser express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layout'); // Nom du fichier de layout sans l'extension .ejs

// Configuration des sessions
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Middleware pour ajouter user à res.locals
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Route pour la racine
app.get('/', (req, res) => {
  res.render('index', { title: 'Accueil', error: null });
});

// Routes
app.use('/documents', documentsRouter);
app.use('/auth', authRouter);
app.use('/profile', profileRouter);
app.use('/admin', adminRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));