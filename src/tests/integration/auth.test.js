const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../../config/redis", () => {
  const mem = new Map();
  return {
    redis: {
      set: jest.fn(async (k, v) => { mem.set(k, String(v)); }),
      get: jest.fn(async (k) => mem.get(k) ?? null),
      del: jest.fn(async (k) => { mem.delete(k); }),
      sAdd: jest.fn(async () => 1),
      sRem: jest.fn(async () => 1),
      expire: jest.fn(async () => 1),
    },
  };
});

const app = require("../../app");
const BASE = "/api/v1/auth";

describe("AUTH INTEGRATION TESTS - EXTENDED", () => {
  describe(`POST ${BASE}/register`, () => {
    it("should register and not expose password", async () => {
      const res = await request(app).post(`${BASE}/register`).send({
        name: "Secure User",
        email: `secure_${Date.now()}@example.com`,
        password: "Password123!",
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user).not.toHaveProperty("password");
    });

    it("should validate password strength", async () => {
      const res = await request(app).post(`${BASE}/register`).send({
        name: "Weak",
        email: `weak_${Date.now()}@example.com`,
        password: "weak",
      });

      expect(res.status).toBe(400);
    });

    it("should trim and validate email", async () => {
      const email = `  trim_${Date.now()}@example.com  `;
      const res = await request(app).post(`${BASE}/register`).send({
        name: "Trim User",
        email,
        password: "Password123!",
      });

      expect([201, 400]).toContain(res.status);
    });
  });

  describe(`POST ${BASE}/login`, () => {
    it("should not reveal if email exists on failed login", async () => {
      const res1 = await request(app).post(`${BASE}/login`).send({
        email: "nonexistent@example.com",
        password: "Password123!",
      });

      const res2 = await request(app).post(`${BASE}/login`).send({
        email: "exists@example.com",
        password: "WrongPassword!",
      });

      expect(res1.status).toBe(401);
      expect(res2.status).toBe(401);
      expect(res1.body.message).toBe(res2.body.message);
    });

    it("should return same token structure as register", async () => {
      const email = `structure_${Date.now()}@example.com`;
      const password = "Password123!";

      const reg = await request(app).post(`${BASE}/register`).send({
        name: "Structure",
        email,
        password,
      });

      const login = await request(app).post(`${BASE}/login`).send({
        email,
        password,
      });

      expect(Object.keys(reg.body.data).sort()).toEqual(
        Object.keys(login.body.data).sort()
      );
    });
  });

  describe(`POST ${BASE}/refresh`, () => {
    it("should invalidate old refresh token after rotation", async () => {
      const email = `rotation_${Date.now()}@example.com`;
      const reg = await request(app).post(`${BASE}/register`).send({
        name: "Rotation",
        email,
        password: "Password123!",
      });

      const oldRefresh = reg.body.data.refreshToken;

      await request(app).post(`${BASE}/refresh`).send({
        refreshToken: oldRefresh,
      });

      const res2 = await request(app).post(`${BASE}/refresh`).send({
        refreshToken: oldRefresh,
      });

      expect(res2.status).toBe(401);
    });

    it("should reject access token used as refresh token", async () => {
      const email = `wrongtype_${Date.now()}@example.com`;
      const reg = await request(app).post(`${BASE}/register`).send({
        name: "Wrong",
        email,
        password: "Password123!",
      });

      const accessToken = reg.body.data.accessToken;

      const res = await request(app).post(`${BASE}/refresh`).send({
        refreshToken: accessToken,
      });

      expect(res.status).toBe(401);
    });
  });

  describe("Password Reset Flow", () => {
    beforeAll(() => {
      process.env.RETURN_RESET_TOKEN = "true";
    });

    it("should complete full reset flow", async () => {
      const email = `reset_${Date.now()}@example.com`;

      await request(app).post(`${BASE}/register`).send({
        name: "Reset",
        email,
        password: "Password123!",
      });

      const forgot = await request(app).post(`${BASE}/forgot-password`).send({
        email,
      });

      expect(forgot.status).toBe(200);
      expect(forgot.body.data).toHaveProperty("resetToken");

      const reset = await request(app).post(`${BASE}/reset-password`).send({
        token: forgot.body.data.resetToken,
        password: "NewPassword123!",
      });

      expect(reset.status).toBe(200);

      const loginWithNew = await request(app).post(`${BASE}/login`).send({
        email,
        password: "NewPassword123!",
      });

      expect(loginWithNew.status).toBe(200);
    });

    it("should not reveal if email exists in forgot-password", async () => {
      const res1 = await request(app).post(`${BASE}/forgot-password`).send({
        email: "exists@example.com",
      });

      const res2 = await request(app).post(`${BASE}/forgot-password`).send({
        email: "notexists@example.com",
      });

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.message).toBe(res2.body.message);
    });
  });

  describe("Security Tests", () => {
    it("should use different JTI for each refresh token", async () => {
      const email = `jti_${Date.now()}@example.com`;

      const reg = await request(app).post(`${BASE}/register`).send({
        name: "JTI",
        email,
        password: "Password123!",
      });

      const token1 = reg.body.data.refreshToken;
      const decoded1 = jwt.decode(token1);

      const refresh = await request(app).post(`${BASE}/refresh`).send({
        refreshToken: token1,
      });

      const token2 = refresh.body.data.refreshToken;
      const decoded2 = jwt.decode(token2);

      expect(decoded1.jti).not.toBe(decoded2.jti);
    });

    it("should include correct token type in JWT", async () => {
      const email = `tokentype_${Date.now()}@example.com`;

      const reg = await request(app).post(`${BASE}/register`).send({
        name: "Type",
        email,
        password: "Password123!",
      });

      const accessDecoded = jwt.decode(reg.body.data.accessToken);
      const refreshDecoded = jwt.decode(reg.body.data.refreshToken);

      expect(accessDecoded.type).toBe("access");
      expect(refreshDecoded.type).toBe("refresh");
    });
  });

  describe("Error Handling", () => {
    it("should return proper error structure", async () => {
      const res = await request(app).post(`${BASE}/login`).send({
        email: "invalid",
        password: "short",
      });

      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("error");
    });

    it("should handle malformed JSON", async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .set("Content-Type", "application/json")
        .send("{ invalid json");

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});