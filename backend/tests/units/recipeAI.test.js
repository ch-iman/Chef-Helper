const axios = require("axios");
const request = require("supertest");
const app = require("../../server");

jest.mock("axios");

describe("Recipe AI generation (Hugging Face mocked)", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should generate recipe successfully from HF response", async () => {

    axios.post.mockResolvedValue({
      status: 200,
      data: [
        {
          generated_text: "Recipe Title: Tomato Pasta\nCooking Time: 30 minutes\nServings: 2"
        }
      ]
    });

    const res = await request(app)
      .post("/api/recipes/generate")
      .set("Authorization", "Bearer faketoken")
      .send({
        ingredients: ["tomato", "pasta"],
        cuisine: "italian",
        difficulty: "easy"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.generatedRecipe).toBeDefined();
    expect(res.body.title).toContain("Tomato");
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  test("should return error when HF API fails", async () => {

    axios.post.mockRejectedValue({
      response: {
        status: 500,
        data: { error: "HF error" }
      }
    });

    const res = await request(app)
      .post("/api/recipes/generate")
      .set("Authorization", "Bearer faketoken")
      .send({
        ingredients: ["tomato"]
      });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Failed to generate recipe");
  });

});
