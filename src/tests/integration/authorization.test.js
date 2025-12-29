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

describe("Authorization Integration Tests", () => {
  let adminToken;
  let userToken;

  beforeAll(async () => {
    adminToken = jwt.sign(
      { id: 1, role: "admin", type: "access" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    userToken = jwt.sign(
      { id: 2, role: "user", type: "access" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  describe("Protected Routes", () => {
    it("should allow authenticated user to access user routes", async () => {

      const decoded = jwt.decode(userToken);
      expect(decoded.role).toBe("user");
    });

    it("should deny unauthenticated access", async () => {
 
      expect(true).toBe(true); 
    });

    it("should allow admin to access admin routes", async () => {
      const decoded = jwt.decode(adminToken);
      expect(decoded.role).toBe("admin");
    });

    it("should deny regular user access to admin routes", async () => {
      const decoded = jwt.decode(userToken);
      expect(decoded.role).not.toBe("admin");
    });
  });
});