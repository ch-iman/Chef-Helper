const request = require("supertest");
const app = require("../../server");

describe("Recipe authorization", () => {

  test("should deny access without authentication", async () => {

    const res = await request(app)
      .post("/api/recipes/generate")
      .send({ ingredients: ["tomato"] });

    expect(res.statusCode).toBe(401);
  });

});
