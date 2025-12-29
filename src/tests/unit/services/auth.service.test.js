jest.mock("../../../config/redis", () => ({
  redis: {
    set: jest.fn(async () => "OK"),
    get: jest.fn(async () => null),
    del: jest.fn(async () => 1),
    sAdd: jest.fn(async () => 1),
    sRem: jest.fn(async () => 1),
    expire: jest.fn(async () => 1),
  },
}));

jest.mock("../../../config/database", () => ({
  prisma: {
    users: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authService = require("../../../services/auth.service");
const { prisma } = require("../../../config/database");
const { redis } = require("../../../config/redis");

describe("AuthService - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should create user and return tokens", async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      prisma.users.create.mockResolvedValue({
        id: 1,
        name: "Test User",
        email: "test@example.com",
        password: "hashedpass",
        role: "user",
      });

      const result = await authService.register({
        name: "Test User",
        email: "test@example.com",
        password: "Password123!",
      });

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result.user.email).toBe("test@example.com");
      expect(result.user).not.toHaveProperty("password");
      expect(redis.set).toHaveBeenCalled();
    });

    it("should throw 409 if email already exists", async () => {
      prisma.users.findFirst.mockResolvedValue({
        id: 1,
        email: "existing@example.com",
      });

      await expect(
        authService.register({
          name: "Test",
          email: "existing@example.com",
          password: "Password123!",
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        message: "Bu email zaten kayıtlı.",
      });
    });

    it("should hash password before storing", async () => {
      prisma.users.findFirst.mockResolvedValue(null);
      prisma.users.create.mockResolvedValue({
        id: 1,
        name: "Test",
        email: "test@example.com",
        password: "hashedpass",
        role: "user",
      });

      await authService.register({
        name: "Test",
        email: "test@example.com",
        password: "Password123!",
      });

      const createCall = prisma.users.create.mock.calls[0][0];
      expect(createCall.data.password).not.toBe("Password123!");
      expect(createCall.data.password.startsWith("$2b$")).toBe(true);
    });
  });

  describe("login", () => {
    it("should login with valid credentials", async () => {
      const hashedPass = await bcrypt.hash("Password123!", 10);
      prisma.users.findFirst.mockResolvedValue({
        id: 1,
        name: "Test",
        email: "test@example.com",
        password: hashedPass,
        role: "user",
      });

      const result = await authService.login({
        email: "test@example.com",
        password: "Password123!",
      });

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result.user.email).toBe("test@example.com");
    });

    it("should throw 401 with wrong password", async () => {
      const hashedPass = await bcrypt.hash("Password123!", 10);
      prisma.users.findFirst.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: hashedPass,
      });

      await expect(
        authService.login({
          email: "test@example.com",
          password: "WrongPassword!",
        })
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Email veya şifre hatalı.",
      });
    });

    it("should throw 401 if user not found", async () => {
      prisma.users.findFirst.mockResolvedValue(null);

      await expect(
        authService.login({
          email: "notfound@example.com",
          password: "Password123!",
        })
      ).rejects.toMatchObject({
        statusCode: 401,
      });
    });
  });

  describe("refresh", () => {
    it("should refresh tokens with valid refreshToken", async () => {
      const user = { id: 1, role: "user" };
      const refreshToken = jwt.sign(
        { id: 1, role: "user", type: "refresh", jti: "test-jti" },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      prisma.users.findFirst.mockResolvedValue(user);
      redis.get.mockResolvedValue("1");

      const result = await authService.refresh({ refreshToken });

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(redis.del).toHaveBeenCalled();
    });

    it("should throw 401 for invalid token", async () => {
      await expect(
        authService.refresh({ refreshToken: "invalid.token" })
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Geçersiz oturum.",
      });
    });

    it("should throw 401 if token is not active", async () => {
      const refreshToken = jwt.sign(
        { id: 1, role: "user", type: "refresh", jti: "test-jti" },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      prisma.users.findFirst.mockResolvedValue({ id: 1 });
      redis.get.mockResolvedValue(null);

      await expect(
        authService.refresh({ refreshToken })
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Oturum sonlandırılmış veya geçersiz.",
      });
    });

    it("should throw 401 if user not found", async () => {
      const refreshToken = jwt.sign(
        { id: 999, role: "user", type: "refresh", jti: "test-jti" },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      prisma.users.findFirst.mockResolvedValue(null);

      await expect(
        authService.refresh({ refreshToken })
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Kullanıcı bulunamadı.",
      });
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      const refreshToken = jwt.sign(
        { id: 1, type: "refresh", jti: "test-jti" },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      const result = await authService.logout({ refreshToken });

      expect(result).toEqual({ success: true });
      expect(redis.del).toHaveBeenCalled();
    });

    it("should return success even with invalid token", async () => {
      const result = await authService.logout({
        refreshToken: "invalid.token",
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe("forgotPassword", () => {
    it("should return resetToken if user exists and RETURN_RESET_TOKEN=true", async () => {
      process.env.RETURN_RESET_TOKEN = "true";
      prisma.users.findFirst.mockResolvedValue({
        id: 1,
        email: "test@example.com",
      });

      const result = await authService.forgotPassword("test@example.com");

      expect(result).toHaveProperty("resetToken");
      expect(typeof result.resetToken).toBe("string");
    });

    it("should return undefined if user not found", async () => {
      prisma.users.findFirst.mockResolvedValue(null);

      const result = await authService.forgotPassword("notfound@example.com");

      expect(result).toBeUndefined();
    });
  });

  describe("resetPassword", () => {
    it("should reset password with valid token", async () => {
      const resetToken = jwt.sign(
        { id: 1, type: "reset" },
        process.env.JWT_RESET_SECRET || process.env.JWT_SECRET
      );

      prisma.users.findFirst.mockResolvedValue({
        id: 1,
        email: "test@example.com",
      });
      prisma.users.update.mockResolvedValue({});

      await authService.resetPassword({
        token: resetToken,
        password: "NewPassword123!",
      });

      expect(prisma.users.update).toHaveBeenCalled();
    });

    it("should throw 400 for invalid token", async () => {
      await expect(
        authService.resetPassword({
          token: "invalid.token",
          password: "NewPassword123!",
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Geçersiz veya süresi dolmuş token.",
      });
    });

    it("should throw 404 if user not found", async () => {
      const resetToken = jwt.sign(
        { id: 999, type: "reset" },
        process.env.JWT_RESET_SECRET || process.env.JWT_SECRET
      );

      prisma.users.findFirst.mockResolvedValue(null);

      await expect(
        authService.resetPassword({
          token: resetToken,
          password: "NewPassword123!",
        })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Kullanıcı bulunamadı.",
      });
    });
  });

  describe("sanitizeUser", () => {
    it("should remove password from user object", () => {
      const user = {
        id: 1,
        name: "Test",
        email: "test@example.com",
        password: "hashedpass",
        role: "user",
      };

      const sanitized = authService.sanitizeUser(user);

      expect(sanitized).not.toHaveProperty("password");
      expect(sanitized).toHaveProperty("id");
      expect(sanitized).toHaveProperty("email");
    });
  });
});