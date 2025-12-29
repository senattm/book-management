const request = require("supertest");

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
const { prisma } = require("../../config/database");

describe("HEALTH API - Integration Tests", () => {
  describe("GET /api/v1/health", () => {
    it("should return health status", async () => {
      const res = await request(app).get("/api/v1/health");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("OK");
      expect(res.body).toHaveProperty("timestamp");
    });
  });

  describe("GET /api/v1/health/live", () => {
    it("should return liveness status", async () => {
      const res = await request(app).get("/api/v1/health/live");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.type).toBe("liveness");
      expect(res.body.message).toBe("OK");
      expect(res.body).toHaveProperty("timestamp");
    });
  });

  describe("GET /api/v1/health/ready", () => {
    it("should return readiness status when DB is up", async () => {
      const res = await request(app).get("/api/v1/health/ready");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.type).toBe("readiness");
      expect(res.body.message).toBe("OK");
      expect(res.body.db).toBe("up");
      expect(res.body).toHaveProperty("timestamp");
    });

    it("should return 503 when DB is down", async () => {
      const originalQueryRaw = prisma.$queryRaw;
      prisma.$queryRaw = jest.fn().mockRejectedValue(new Error("DB connection failed"));

      const res = await request(app).get("/api/v1/health/ready");

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.type).toBe("readiness");
      expect(res.body.message).toBe("NOT READY");
      expect(res.body.db).toBe("down");

      prisma.$queryRaw = originalQueryRaw;
    });
  });
});

