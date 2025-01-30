const bcrypt = require('bcrypt');

const password = 'nono'; // Mot de passe à hacher

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
  } else {
    console.log('Hashed password:', hash);
  }
});