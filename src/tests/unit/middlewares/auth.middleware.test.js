const jwt = require("jsonwebtoken");
const { authenticate, authorize } = require("../../../middlewares/auth.middleware");

describe("Auth Middleware - Unit Tests", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {}, user: null };
    res = {};
    next = jest.fn();
    process.env.JWT_SECRET = "test-secret";
  });

  describe("authenticate", () => {
    it("should pass with valid access token", () => {
      const token = jwt.sign(
        { id: 1, role: "user", type: "access" },
        process.env.JWT_SECRET
      );
      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);

      expect(req.user).toEqual({ id: 1, role: "user", type: "access", iat: expect.any(Number) });
      expect(next).toHaveBeenCalledWith();
    });

    it("should reject missing authorization header", () => {
      authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: "Yetkilendirme tokeni bulunamadı.",
        })
      );
    });

    it("should reject invalid Bearer format", () => {
      req.headers.authorization = "InvalidFormat token";

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });

    it("should reject expired token", () => {
      const token = jwt.sign(
        { id: 1, role: "user", type: "access" },
        process.env.JWT_SECRET,
        { expiresIn: "0s" }
      );
      req.headers.authorization = `Bearer ${token}`;

      setTimeout(() => {
        authenticate(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: 401,
          })
        );
      }, 100);
    });

    it("should reject refresh token type", () => {
      const token = jwt.sign(
        { id: 1, role: "user", type: "refresh" },
        process.env.JWT_SECRET
      );
      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: "Geçersiz token tipi.",
        })
      );
    });

    it("should reject malformed token", () => {
      req.headers.authorization = "Bearer malformed.token.here";

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });
  });

  describe("authorize", () => {
    it("should pass for authorized role", () => {
      req.user = { id: 1, role: "admin" };
      const middleware = authorize("admin");

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it("should reject for unauthorized role", () => {
      req.user = { id: 1, role: "user" };
      const middleware = authorize("admin");

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: "Bu işlem için yetkiniz bulunmamaktadır.",
        })
      );
    });

    it("should reject if no user in request", () => {
      req.user = null;
      const middleware = authorize("admin");

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: "Kimlik doğrulaması gereklidir.",
        })
      );
    });

    it("should handle multiple allowed roles", () => {
      req.user = { id: 1, role: "user" };
      const middleware = authorize("admin", "user");

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it("should reject if role not in allowed list", () => {
      req.user = { id: 1, role: "guest" };
      const middleware = authorize("admin", "user");

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
        })
      );
    });
  });
});