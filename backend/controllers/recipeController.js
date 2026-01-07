const Recipe = require('../models/Recipe');
const axios = require('axios');

// Hugging Face API Configuration
const HF_ACCESS_TOKEN = process.env.HF_ACCESS_TOKEN;

// UPDATED: Mistral-7B-Instruct-v0.3 endpoint
const HUGGINGFACE_API_URL = 'https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.3';


/**
 * STEP 1: Format prompt according to Mistral v0.3's instruction format
 * Mistral v0.3 uses the same format but supports extended vocabulary and function calling
 * Format: <s>[INST] prompt [/INST]
 */
const formatMistralPrompt = (ingredients, cuisine, difficulty) => {
  const userMessage = `Generate a detailed recipe using these ingredients: ${ingredients.join(', ')}.
Cuisine: ${cuisine || 'any'}
Difficulty: ${difficulty || 'medium'}

Please provide:
1. Recipe Title
2. Cooking Time (in minutes)
3. Servings
4. Detailed Step-by-Step Instructions
5. Any additional ingredients needed

Format the response clearly with labeled sections.`;

  // Mistral instruction format with proper tokens
  return `<s>[INST] ${userMessage} [/INST]`;
};

/**
 * STEP 2: Call Hugging Face API with Mistral v0.3
 * Uses the Inference API endpoint with improved parameters
 */
const generateRecipeFromAI = async (ingredients, cuisine, difficulty) => {
  try {
    const prompt = formatMistralPrompt(ingredients, cuisine, difficulty);
    
    console.log('📤 Sending request to Hugging Face API (Mistral-7B-Instruct-v0.3)...');
    
    const response = await axios.post(
      HUGGINGFACE_API_URL,
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 1000,      // Maximum length of generated text
          temperature: 0.7,           // Controls creativity (0.0-1.0)
          top_p: 0.9,                 // Nucleus sampling
          top_k: 50,                  // Top-k sampling (v0.3 supports this better)
          repetition_penalty: 1.1,    // Prevent repetition
          do_sample: true,            // Enable sampling
          return_full_text: false     // Only return generated text
        },
        options: {
          use_cache: false,           // Get fresh responses
          wait_for_model: true        // Wait if model is loading
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${HF_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'x-use-cache': 'false'      // Additional cache control
        },
        timeout: 120000 // 120 seconds timeout
      }
    );

    console.log('✅ HF Response Status:', response.status);
    
    // Extract generated text from response
    let generatedText;
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      generatedText = response.data[0]?.generated_text;
      console.log('📝 Response format: Array');
    } else if (response.data?.generated_text) {
      generatedText = response.data.generated_text;
      console.log('📝 Response format: Object');
    } else if (typeof response.data === 'string') {
      generatedText = response.data;
      console.log('📝 Response format: String');
    } else if (response.data?.error) {
      throw new Error(`HF API Error: ${response.data.error}`);
    }

    // Validate response
    if (!generatedText || generatedText.trim().length === 0) {
      console.error('❌ Empty response from API');
      console.error('Response data:', JSON.stringify(response.data, null, 2));
      throw new Error('No generated text in API response');
    }

    // Clean up any remaining instruction tokens
    generatedText = generatedText
      .replace(/<s>/g, '')
      .replace(/\[INST\]/g, '')
      .replace(/\[\/INST\]/g, '')
      .replace(/<\/s>/g, '')
      .trim();

    console.log('✅ Generated recipe text (length:', generatedText.length, 'chars)');
    return generatedText;

  } catch (error) {
    console.error('❌ HUGGING FACE API ERROR:');
    console.error('Error Message:', error.message);
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      console.error('HTTP Status:', status);
      console.error('Response Data:', JSON.stringify(data, null, 2));
      
      // Handle specific error codes
      switch (status) {
        case 404:
          throw new Error('Model not found. Verify the model name: mistralai/Mistral-7B-Instruct-v0.3');
        
        case 401:
          throw new Error('Invalid Hugging Face token. Get a new token at https://huggingface.co/settings/tokens');
        
        case 403:
          throw new Error('Access denied. You may need to accept the model license at https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3');
        
        case 503:
          const estimatedTime = data?.estimated_time || 20;
          throw new Error(`Model is loading. Estimated wait time: ${estimatedTime} seconds. Please try again.`);
        
        case 429:
          throw new Error('Rate limit exceeded. Please wait before making another request.');
        
        case 500:
          throw new Error('Hugging Face server error. Please try again in a moment.');
        
        default:
          throw new Error(`API Error (${status}): ${data?.error || error.response.statusText}`);
      }
    } else if (error.request) {
      console.error('No response received from Hugging Face API');
      throw new Error('Network error: Unable to reach Hugging Face API. Check your internet connection.');
    } else {
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
};

/**
 * STEP 3: Parse AI-generated text to extract structured data
 * Enhanced parsing for better extraction
 */
const parseGeneratedRecipe = (generatedText) => {
  const lines = generatedText.split('\n').filter(line => line.trim());
  
  // Extract Recipe Title
  let title = 'AI Generated Recipe';
  
  const titlePatterns = [
    /(?:recipe\s*title|title):\s*(.+)/i,
    /^#+\s*(.+)/,                          // Markdown headers
    /^\*\*(.+?)\*\*/,                      // Bold text
    /^Recipe:\s*(.+)/i,
    /^(.+?)\s*recipe/i,
    /^"(.+?)"/,                            // Quoted title
    /^[''](.+?)['']/                       // Single quoted title
  ];
  
  for (const pattern of titlePatterns) {
    const match = generatedText.match(pattern);
    if (match && match[1]) {
      title = match[1].trim().replace(/[*#:"']/g, '').substring(0, 100);
      break;
    }
  }
  
  // Fallback: use first meaningful line
  if (title === 'AI Generated Recipe' && lines.length > 0) {
    const firstLine = lines[0].trim().replace(/^[*#:\-\d.]+/, '').trim();
    if (firstLine.length > 5 && firstLine.length < 100) {
      title = firstLine;
    }
  }

  // Extract Cooking Time
  let cookingTime = 'Not specified';
  const timePatterns = [
    /(?:cooking\s*time|prep\s*time|total\s*time|time|duration):\s*(\d+\s*(?:minutes?|mins?|hours?|hrs?|h))/i,
    /(\d+)\s*(?:minutes?|mins?)\s*(?:cooking|preparation|total)/i,
    /(?:takes?|requires?)?\s*(?:about|approximately)?\s*(\d+)\s*(?:minutes?|mins?|hours?|hrs?)/i,
    /(\d+[-–]\d+)\s*(?:minutes?|mins?)/i  // Range like "30-40 minutes"
  ];
  
  for (const pattern of timePatterns) {
    const match = generatedText.match(pattern);
    if (match && match[1]) {
      cookingTime = match[1].trim();
      break;
    }
  }

  // Extract Servings
  let servings = 2; // Default
  const servingsPatterns = [
    /(?:servings?|serves?|portions?):\s*(\d+)/i,
    /(?:makes?|yields?):\s*(\d+)\s*(?:servings?|portions?)/i,
    /(\d+)\s*(?:people|persons?|servings?)/i,
    /for\s*(\d+)\s*people/i
  ];
  
  for (const pattern of servingsPatterns) {
    const match = generatedText.match(pattern);
    if (match && match[1]) {
      const parsed = parseInt(match[1]);
      if (parsed > 0 && parsed < 100) { // Sanity check
        servings = parsed;
        break;
      }
    }
  }

  console.log('📊 Parsed recipe info:', { title, cookingTime, servings });
  
  return { title, cookingTime, servings };
};

/**
 * STEP 4: Main Controller - Generate new recipe using AI
 * @route   POST /api/recipes/generate
 * @access  Private
 * @body    { ingredients: string[], cuisine?: string, difficulty?: string, servings?: number }
 */
const generateRecipe = async (req, res) => {
  try {
    const { ingredients, cuisine, difficulty, servings } = req.body;

    // Validation
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ 
        message: 'Please provide at least one ingredient as an array',
        example: { ingredients: ['chicken', 'tomatoes', 'garlic'] }
      });
    }

    // Validate ingredients are non-empty strings
    const validIngredients = ingredients.filter(
      ing => typeof ing === 'string' && ing.trim().length > 0
    );

    if (validIngredients.length === 0) {
      return res.status(400).json({ 
        message: 'All ingredients must be non-empty strings' 
      });
    }

    // Check for API token
    if (!HF_ACCESS_TOKEN) {
      console.error('❌ HF_ACCESS_TOKEN not configured');
      return res.status(500).json({
        message: 'Hugging Face API token not configured. Please add HF_ACCESS_TOKEN to your environment variables.'
      });
    }

    console.log('🍳 Starting recipe generation...');
    console.log('📝 Request:', { 
      ingredients: validIngredients.slice(0, 5),
      cuisine, 
      difficulty,
      userId: req.user._id 
    });

    // Generate recipe using Mistral AI v0.3
    const generatedText = await generateRecipeFromAI(validIngredients, cuisine, difficulty);

    // Parse structured data
    const { title, cookingTime, servings: parsedServings } = parseGeneratedRecipe(generatedText);

    // Save to database
    const recipe = await Recipe.create({
      user: req.user._id,
      ingredients: validIngredients,
      generatedRecipe: generatedText,
      title,
      cuisine: cuisine || 'General',
      difficulty: difficulty || 'medium',
      cookingTime,
      servings: servings || parsedServings
    });

    console.log('✅ Recipe created successfully! ID:', recipe._id);
    
    res.status(201).json(recipe);

  } catch (error) {
    console.error('❌ Generate Recipe Error:', error.message);
    
    const errorResponse = {
      message: 'Failed to generate recipe',
      error: error.message
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
    }
    
    res.status(500).json(errorResponse);
  }
};

/**
 * Get all recipes for logged in user
 * @route   GET /api/recipes
 * @access  Private
 */
const getRecipes = async (req, res) => {
  try {
    const { cuisine, difficulty, isFavorite, search, limit = 50, page = 1 } = req.query;
    
    // Build query - filter by user
    const query = { user: req.user._id };
    
    // Add filters
    if (cuisine) query.cuisine = cuisine;
    if (difficulty) query.difficulty = difficulty;
    if (isFavorite === 'true') query.isFavorite = true;
    
    // Add search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ingredients: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const recipes = await Recipe.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-__v');
    
    const total = await Recipe.countDocuments(query);
    
    console.log(`📚 Found ${recipes.length}/${total} recipes for user ${req.user._id}`);
    
    res.json({
      recipes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('❌ Get Recipes Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get single recipe by ID
 * @route   GET /api/recipes/:id
 * @access  Private
 */
const getRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).select('-__v');

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Authorization check
    if (recipe.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this recipe' });
    }

    console.log('📖 Recipe retrieved:', recipe._id);
    res.json(recipe);
    
  } catch (error) {
    console.error('❌ Get Recipe Error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid recipe ID format' });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Update recipe
 * @route   PUT /api/recipes/:id
 * @access  Private
 */
const updateRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    if (recipe.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this recipe' });
    }

    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { 
        new: true,
        runValidators: true
      }
    ).select('-__v');

    console.log('✏️ Recipe updated:', updatedRecipe._id);
    res.json(updatedRecipe);
    
  } catch (error) {
    console.error('❌ Update Recipe Error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Delete recipe
 * @route   DELETE /api/recipes/:id
 * @access  Private
 */
const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    if (recipe.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this recipe' });
    }

    await recipe.deleteOne();

    console.log('🗑️ Recipe deleted:', req.params.id);
    res.json({ 
      message: 'Recipe deleted successfully', 
      id: req.params.id 
    });
    
  } catch (error) {
    console.error('❌ Delete Recipe Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Toggle recipe favorite status
 * @route   PATCH /api/recipes/:id/favorite
 * @access  Private
 */
const toggleFavorite = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    if (recipe.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    recipe.isFavorite = !recipe.isFavorite;
    await recipe.save();

    console.log(`${recipe.isFavorite ? '⭐' : '☆'} Recipe favorite toggled:`, recipe._id);
    res.json(recipe);
    
  } catch (error) {
    console.error('❌ Toggle Favorite Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Regenerate recipe with different parameters
 * @route   POST /api/recipes/:id/regenerate
 * @access  Private
 */
const regenerateRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    if (recipe.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { cuisine, difficulty } = req.body;

    console.log('🔄 Regenerating recipe:', { cuisine, difficulty });

    // Generate new recipe
    const generatedText = await generateRecipeFromAI(
      recipe.ingredients, 
      cuisine || recipe.cuisine, 
      difficulty || recipe.difficulty
    );

    const { title, cookingTime } = parseGeneratedRecipe(generatedText);

    // Update recipe
    recipe.generatedRecipe = generatedText;
    recipe.title = title;
    recipe.cookingTime = cookingTime;
    if (cuisine) recipe.cuisine = cuisine;
    if (difficulty) recipe.difficulty = difficulty;

    await recipe.save();

    console.log('✅ Recipe regenerated:', recipe._id);
    res.json(recipe);
    
  } catch (error) {
    console.error('❌ Regenerate Recipe Error:', error);
    res.status(500).json({ message: 'Failed to regenerate recipe', error: error.message });
  }
};

module.exports = {
  generateRecipe,
  getRecipes,
  getRecipe,
  updateRecipe,
  deleteRecipe,
  toggleFavorite,
  regenerateRecipe
};