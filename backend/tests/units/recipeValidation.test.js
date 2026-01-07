const request = require("supertest");
const app = require("../../server");

describe("Recipe input validation", () => {

  test("should reject empty ingredients array", async () => {
    const res = await request(app)
      .post("/api/recipes/generate")
      .set("Authorization", "Bearer faketoken")
      .send({ ingredients: [] });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("at least one ingredient");
  });

  test("should reject non-string ingredients", async () => {
    const res = await request(app)
      .post("/api/recipes/generate")
      .set("Authorization", "Bearer faketoken")
      .send({ ingredients: ["", "   "] });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("non-empty strings");
  });

});
