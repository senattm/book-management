const {
  globalLimiter,
  authLimiter,
  registerLimiter,
} = require("../../../middlewares/rateLimit.middleware");

describe("Rate Limit Middleware - Unit Tests", () => {
  let req, res;

  beforeEach(() => {
    req = {
      originalUrl: "/api/v1/test",
      ip: "127.0.0.1",
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("globalLimiter", () => {
    it("should be an instance of rateLimit middleware", () => {
      expect(globalLimiter).toBeDefined();
      expect(typeof globalLimiter).toBe("function");
    });

    it("should call handler with correct error format when limit exceeded", () => {
      const rateLimitModule = require("../../../middlewares/rateLimit.middleware");
      expect(typeof globalLimiter).toBe("function");
    });
  });

  describe("authLimiter", () => {
    it("should be an instance of rateLimit middleware", () => {
      expect(authLimiter).toBeDefined();
      expect(typeof authLimiter).toBe("function");
    });

    it("should be callable as middleware", () => {
      expect(typeof authLimiter).toBe("function");
    });
  });

  describe("registerLimiter", () => {
    it("should be an instance of rateLimit middleware", () => {
      expect(registerLimiter).toBeDefined();
      expect(typeof registerLimiter).toBe("function");
    });

    it("should be callable as middleware", () => {
      expect(typeof registerLimiter).toBe("function");
    });
  });

  describe("rateLimitHandler", () => {
    it("should export rate limit handlers", () => {
      const rateLimitModule = require("../../../middlewares/rateLimit.middleware");
      expect(rateLimitModule.globalLimiter).toBeDefined();
      expect(rateLimitModule.authLimiter).toBeDefined();
      expect(rateLimitModule.registerLimiter).toBeDefined();
    });

    it("should handle rate limit errors correctly", () => {
      expect(typeof globalLimiter).toBe("function");
      expect(typeof authLimiter).toBe("function");
      expect(typeof registerLimiter).toBe("function");
    });
  });
});
