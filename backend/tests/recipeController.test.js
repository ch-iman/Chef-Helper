const axios = require("axios");
const request = require("supertest");
const app = require("../server");

jest.mock("axios"); // 🔑 activation du mock

describe("Recipe generation with Hugging Face (mocked)", () => {

  test("should return generated recipe when HF responds OK", async () => {

    // 🧪 Fake réponse Hugging Face
    axios.post.mockResolvedValue({
      data: {
        generated_text: "Recipe with tomatoes and eggs"
      }
    });

    const res = await request(app)
      .post("/api/recipes/generate")
      .send({ ingredients: ["tomato", "egg"] });

    expect(res.statusCode).toBe(200);
    expect(res.body.generated_text).toContain("tomatoes");
  });

});
test("should handle Hugging Face API error", async () => {

  axios.post.mockRejectedValue(new Error("HF API error"));

  const res = await request(app)
    .post("/api/recipes/generate")
    .send({ ingredients: ["tomato"] });

  expect(res.statusCode).toBe(500);
  expect(res.body.error).toBeDefined();
});
