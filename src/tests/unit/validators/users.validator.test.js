const {
  userIdParamSchema,
  listUsersSchema,
  updateUserSchema,
  borrowingsQuerySchema,
} = require("../../../validators/users.validator");

describe("Users Validators - Unit Tests", () => {
  describe("userIdParamSchema", () => {
    it("should accept valid UUID", () => {
      const valid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
      };

      const result = userIdParamSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const invalid = {
        params: {
          id: "not-a-uuid",
        },
      };

      const result = userIdParamSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const invalid = {
        params: {},
      };

      const result = userIdParamSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("listUsersSchema", () => {
    it("should accept valid query params", () => {
      const valid = {
        query: {
          page: "1",
          limit: "10",
          search: "Test",
          role: "admin",
        },
      };

      const result = listUsersSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept empty query", () => {
      const valid = {
        query: {},
      };

      const result = listUsersSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept role as user", () => {
      const valid = {
        query: {
          role: "user",
        },
      };

      const result = listUsersSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept role as admin", () => {
      const valid = {
        query: {
          role: "admin",
        },
      };

      const result = listUsersSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid role", () => {
      const invalid = {
        query: {
          role: "invalid-role",
        },
      };

      const result = listUsersSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("updateUserSchema", () => {
    it("should accept valid update data with name", () => {
      const valid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          name: "Updated Name",
        },
      };

      const result = updateUserSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept valid update data with email", () => {
      const valid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          email: "updated@example.com",
        },
      };

      const result = updateUserSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept valid update data with password", () => {
      const valid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          password: "NewPassword123!",
        },
      };

      const result = updateUserSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept update with multiple fields", () => {
      const valid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          name: "Updated Name",
          email: "updated@example.com",
        },
      };

      const result = updateUserSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject empty update body", () => {
      const invalid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {},
      };

      const result = updateUserSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject name shorter than 2 chars", () => {
      const invalid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          name: "A",
        },
      };

      const result = updateUserSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject invalid email format", () => {
      const invalid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          email: "not-an-email",
        },
      };

      const result = updateUserSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject password shorter than 6 chars", () => {
      const invalid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          password: "12345",
        },
      };

      const result = updateUserSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject invalid UUID in params", () => {
      const invalid = {
        params: {
          id: "not-a-uuid",
        },
        body: {
          name: "Test",
        },
      };

      const result = updateUserSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("borrowingsQuerySchema", () => {
    it("should accept valid query params", () => {
      const valid = {
        query: {
          page: "1",
          limit: "10",
          status: "active",
        },
      };

      const result = borrowingsQuerySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept status as returned", () => {
      const valid = {
        query: {
          status: "returned",
        },
      };

      const result = borrowingsQuerySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept empty query", () => {
      const valid = {
        query: {},
      };

      const result = borrowingsQuerySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const invalid = {
        query: {
          status: "invalid-status",
        },
      };

      const result = borrowingsQuerySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});

