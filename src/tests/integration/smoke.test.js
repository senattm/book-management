const request = require("supertest");
const app = require("../../app");

describe("SMOKE TEST", () => {
  it("GET / should return api is running", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
  });
});
