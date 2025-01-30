const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Document = require('../models/Document');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB connected');

    try {
      const users = await User.find();
      for (const user of users) {
        const borrowedBooksCount = await Document.countDocuments({ borrower: user.username });
        user.borrowedCount = borrowedBooksCount;
        await user.save();
      }
      console.log('Updated borrowedCount for all users');
    } catch (error) {
      console.error('Error updating users:', error);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));