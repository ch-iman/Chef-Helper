import React from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import chefClaudeLogo from "./assets/chef-claude-icon.png"

export default function Content() {

    const [ingredients, setIngredients] = React.useState([])
    const [recipe, setRecipe] = React.useState("")        // store the recipe text
    const [loading, setLoading] = React.useState(false)   // show loading state
    const [error, setError] = React.useState(null)        // store any error
    const ingredientsListItems = ingredients.map(ingredient => (
        <li key={ingredient}>{ingredient}</li>
    ))

    function addIngredient(formData) {
        const newIngredient = formData.get("ingredient")
        setIngredients(prevIngredients => [...prevIngredients, newIngredient])
    }
    //  This function sends the ingredients to the backend
    async function getRecipe() {
        try {
            setLoading(true)
            setError(null)
            setRecipe("")

            const response = await fetch("http://localhost:3000/api/recipe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ ingredients })
            })

            const data = await response.json()

            if (!response.ok) throw new Error(data.error || "Failed to fetch recipe")

            setRecipe(data.recipe)
        } catch (err) {
            console.error(err)
            setError("Error fetching recipe. Please try again.")
        } finally {
            setLoading(false)
        }
    }
    /**
     * Challenge:
     * Only display the div.get-recipe-container if the ingredients list
     * has more than 3 items in it. (Fewer than that and it might not
     * give great results from the chef 🤖👩‍🍳)
     */

    return (
        <>
        <header>
            <img src={chefClaudeLogo}/>
            <h1>Chef Helper</h1>
        </header>
        <main>

            <form action={addIngredient} className="add-ingredient-form">
                <input
                    type="text"
                    placeholder="e.g. oregano"
                    aria-label="Add ingredient"
                    name="ingredient"
                />
                <button>Add ingredient</button>
            </form>
            {ingredients.length > 0 && <section>
                <h2>Ingredients on hand:</h2>
                <ul className="ingredients-list" aria-live="polite">{ingredientsListItems}</ul>
            </section>}
            {ingredients.length > 3 && <section> <div className="get-recipe-container">
                    <div>
                        <h3>Ready for a recipe?</h3>
                        <p>Generate a recipe from your list of ingredients.</p>
                    </div>
                    <button onClick={getRecipe} disabled={loading}>
                            {loading ? "Generating..." : "Get a recipe"}
                    </button>
                </div>
            </section>}
            {recipe && (
                <section className="recipe-output">
                    <h2>🍳 Your Recipe:</h2>
                    {/* Hugging Face returns markdown, so we can render it safely */}
                    <div dangerouslySetInnerHTML={{ __html: marked.parse(recipe) }} />
                </section>
            )}

        </main>
        </>
    )
}