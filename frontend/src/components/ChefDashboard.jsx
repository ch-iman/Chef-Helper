import { useState, useEffect } from 'react';

export default function ChefDashboard() {
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [error, setError] = useState('');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/recipes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load recipes');
      
      const data = await response.json();

      // Normalize response into an array. API might return an array directly
      // or an object like { recipes: [...] } or { data: [...] }.
      let list = [];
      if (Array.isArray(data)) list = data;
      else if (data && Array.isArray(data.recipes)) list = data.recipes;
      else if (data && Array.isArray(data.data)) list = data.data;
      else list = [];

      setRecipes(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateRecipe = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!ingredients.trim()) {
      setError('Please enter at least one ingredient');
      return;
    }

    setGenerating(true);
    
    try {
      const ingredientsList = ingredients.split(',').map(i => i.trim());
      
      const response = await fetch('http://localhost:5000/api/recipes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ingredients: ingredientsList,
          cuisine,
          difficulty
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to generate recipe');
      }

      const newRecipe = await response.json();
      setRecipes(prev => [newRecipe, ...(Array.isArray(prev) ? prev : [])]);
      setSelectedRecipe(newRecipe);
      setIngredients('');
      setCuisine('');
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const toggleFavorite = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/recipes/${id}/favorite`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to update favorite');

      const updated = await response.json();
      setRecipes(prev => {
        if (!Array.isArray(prev)) return [updated];
        return prev.map(r => r._id === id ? updated : r);
      });
      if (selectedRecipe?._id === id) setSelectedRecipe(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteRecipe = async (id) => {
    if (!window.confirm('Delete this recipe?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/recipes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete recipe');

      setRecipes(prev => Array.isArray(prev) ? prev.filter(r => r._id !== id) : []);
      if (selectedRecipe?._id === id) setSelectedRecipe(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">👨‍🍳 Chef Helper</h1>
            <p className="text-gray-400 text-sm">Welcome, {user.name}</p>
          </div>
          <button
            onClick={logout}
            className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recipe Generator Form */}
          <div className="lg:col-span-1">
            <div className="bg-black text-white p-6 rounded-lg shadow-xl sticky top-4">
              <h2 className="text-xl font-bold mb-4">Generate Recipe</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Ingredients (comma-separated)
                  </label>
                  <textarea
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-black rounded"
                    rows="3"
                    placeholder="chicken, tomatoes, garlic"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Cuisine (optional)
                  </label>
                  <input
                    type="text"
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-black rounded"
                    placeholder="Italian, Mexican, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-black rounded"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <button
                  onClick={generateRecipe}
                  disabled={generating}
                  className="w-full bg-white text-black font-bold py-3 rounded hover:bg-gray-200 transition disabled:opacity-50"
                >
                  {generating ? 'Generating...' : '✨ Generate Recipe'}
                </button>
              </div>
            </div>
          </div>

          {/* Recipe List & Detail */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold text-black">My Recipes</h2>
            
            {loading ? (
              <p className="text-gray-600">Loading recipes...</p>
            ) : recipes.length === 0 ? (
              <p className="text-gray-600">No recipes yet. Generate your first recipe!</p>
            ) : (
              <div className="space-y-4">
                {recipes.map(recipe => (
                  <div
                    key={recipe._id}
                    className="bg-black text-white p-4 rounded-lg shadow-lg cursor-pointer hover:bg-gray-900 transition"
                    onClick={() => setSelectedRecipe(recipe)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-2">{recipe.title}</h3>
                        <div className="flex gap-2 text-sm text-gray-400">
                          <span>🍽️ {recipe.cuisine}</span>
                          <span>⏱️ {recipe.cookingTime}</span>
                          <span>📊 {recipe.difficulty}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {recipe.ingredients.map((ing, i) => (
                            <span key={i} className="bg-gray-800 px-2 py-1 rounded text-xs">
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(recipe._id);
                          }}
                          className="text-2xl"
                        >
                          {recipe.isFavorite ? '❤️' : '🤍'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRecipe(recipe._id);
                          }}
                          className="text-red-500 hover:text-red-400"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recipe Detail Modal */}
        {selectedRecipe && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-black text-white p-6 rounded-t-lg">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold">{selectedRecipe.title}</h2>
                  <button
                    onClick={() => setSelectedRecipe(null)}
                    className="text-2xl hover:text-gray-400"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex gap-4 mt-2 text-sm">
                  <span>🍽️ {selectedRecipe.cuisine}</span>
                  <span>⏱️ {selectedRecipe.cookingTime}</span>
                  <span>📊 {selectedRecipe.difficulty}</span>
                  <span>👥 {selectedRecipe.servings} servings</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">Ingredients:</h3>
                <ul className="list-disc list-inside mb-4">
                  {selectedRecipe.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
                <h3 className="font-bold text-lg mb-2">Instructions:</h3>
                <div className="whitespace-pre-wrap text-gray-800">
                  {selectedRecipe.generatedRecipe}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}