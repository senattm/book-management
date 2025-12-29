const {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../../../validators/auth.validator");

describe("Auth Validators - Unit Tests", () => {
  describe("registerSchema", () => {
    it("should accept valid registration data", () => {
      const valid = {
        body: {
          name: "John Doe",
          email: "john@example.com",
          password: "Password123!",
        },
      };

      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject name shorter than 2 chars", () => {
      const invalid = {
        body: {
          name: "J",
          email: "john@example.com",
          password: "Password123!",
        },
      };

      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("en az 2 karakter");
    });

    it("should reject invalid email format", () => {
      const invalid = {
        body: {
          name: "John Doe",
          email: "not-an-email",
          password: "Password123!",
        },
      };

      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject password without lowercase", () => {
      const invalid = {
        body: {
          name: "John Doe",
          email: "john@example.com",
          password: "PASSWORD123!",
        },
      };

      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject password without uppercase", () => {
      const invalid = {
        body: {
          name: "John Doe",
          email: "john@example.com",
          password: "password123!",
        },
      };

      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject password without number", () => {
      const invalid = {
        body: {
          name: "John Doe",
          email: "john@example.com",
          password: "PasswordABC!",
        },
      };

      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject password shorter than 8 chars", () => {
      const invalid = {
        body: {
          name: "John Doe",
          email: "john@example.com",
          password: "Pass1!",
        },
      };

      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("should accept valid login data", () => {
      const valid = {
        body: {
          email: "john@example.com",
          password: "Password123!",
        },
      };

      const result = loginSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalid = {
        body: {
          email: "not-email",
          password: "Password123!",
        },
      };

      const result = loginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const invalid = {
        body: {
          email: "john@example.com",
          password: "",
        },
      };

      const result = loginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("refreshSchema", () => {
    it("should accept valid refresh token", () => {
      const valid = {
        body: { refreshToken: "valid.jwt.token" },
      };

      const result = refreshSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject empty refresh token", () => {
      const invalid = {
        body: { refreshToken: "" },
      };

      const result = refreshSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("logoutSchema", () => {
    it("should accept valid logout request", () => {
      const valid = {
        body: { refreshToken: "valid.jwt.token" },
      };

      const result = logoutSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("should accept valid email", () => {
      const valid = {
        body: { email: "john@example.com" },
      };

      const result = forgotPasswordSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalid = {
        body: { email: "not-email" },
      };

      const result = forgotPasswordSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("should accept valid reset data", () => {
      const valid = {
        body: {
          token: "valid.reset.token",
          password: "NewPassword123!",
        },
      };

      const result = resetPasswordSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject weak password", () => {
      const invalid = {
        body: {
          token: "valid.reset.token",
          password: "weak",
        },
      };

      const result = resetPasswordSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});