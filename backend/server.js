import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { HfInference } from "@huggingface/inference";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const hf = new HfInference(process.env.HF_ACCESS_TOKEN);

const SYSTEM_PROMPT = `
You are an assistant that receives a list of ingredients and suggests a recipe.
Format your response in markdown.
`;

app.post("/api/recipe", async (req, res) => {
  try {
    const ingredientsArr = req.body.ingredients;
    if (!Array.isArray(ingredientsArr)) {
      return res.status(400).json({ error: "ingredients must be an array" });
    }

    const ingredientsString = ingredientsArr.join(", ");
    const response = await hf.chatCompletion({
      model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `I have ${ingredientsString}. Please give me a recipe!` },
      ],
      max_tokens: 1024,
    });

    res.json({ recipe: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
