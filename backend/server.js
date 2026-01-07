const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(
    process.env.MONGODB_URI || 'mongodb://localhost:27017/chef-helper-app',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));
}


// Routes
const authRoutes = require('./routes/authRoutes');
const recipeRoutes = require('./routes/recipeRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);

// Health check route ✅ (DÉJÀ PRÉSENTE)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Chef Helper API is running'
  });
});

module.exports = app; // 👈 LIGNE CLÉ POUR LES TESTS
