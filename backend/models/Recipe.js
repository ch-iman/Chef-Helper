const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ingredients: {
    type: [String],
    required: true
  },
  generatedRecipe: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  cuisine: {
    type: String,
    default: 'General'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  cookingTime: {
    type: String,
    default: 'Unknown'
  },
  servings: {
    type: Number,
    default: 2
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  tags: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('Recipe', recipeSchema);