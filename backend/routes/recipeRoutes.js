const express = require('express');
const router = express.Router();
const {
  generateRecipe,
  getRecipes,
  getRecipe,
  updateRecipe,
  deleteRecipe,
  toggleFavorite,
  regenerateRecipe
} = require('../controllers/recipeController');
const { protect } = require('../middleware/auth');

// All routes are protected (require authentication)
router.use(protect);

// Recipe generation
router.post('/generate', generateRecipe);

// Standard CRUD routes
router.route('/')
  .get(getRecipes);

router.route('/:id')
  .get(getRecipe)
  .put(updateRecipe)
  .delete(deleteRecipe);

// Additional actions
router.patch('/:id/favorite', toggleFavorite);
router.post('/:id/regenerate', regenerateRecipe);

module.exports = router;