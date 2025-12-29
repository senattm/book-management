const {
  listCategoriesSchema,
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
  categoryBooksSchema,
} = require("../../../validators/categories.validator");

describe("Categories Validators - Unit Tests", () => {
  describe("listCategoriesSchema", () => {
    it("should accept valid query params", () => {
      const valid = {
        query: {
          page: "1",
          limit: "10",
          search: "Test",
          parentid: "123e4567-e89b-12d3-a456-426614174000",
        },
      };

      const result = listCategoriesSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept empty query", () => {
      const valid = {
        query: {},
      };

      const result = listCategoriesSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID for parentid", () => {
      const invalid = {
        query: {
          parentid: "not-a-uuid",
        },
      };

      const result = listCategoriesSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("categoryIdParamSchema", () => {
    it("should accept valid UUID", () => {
      const valid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
      };

      const result = categoryIdParamSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const invalid = {
        params: {
          id: "not-a-uuid",
        },
      };

      const result = categoryIdParamSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const invalid = {
        params: {},
      };

      const result = categoryIdParamSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("createCategorySchema", () => {
    it("should accept valid category data", () => {
      const valid = {
        body: {
          categoryname: "Test Category",
          parentid: null,
        },
      };

      const result = createCategorySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept category without parentid", () => {
      const valid = {
        body: {
          categoryname: "Test Category",
        },
      };

      const result = createCategorySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept category with valid parentid UUID", () => {
      const valid = {
        body: {
          categoryname: "Child Category",
          parentid: "123e4567-e89b-12d3-a456-426614174000",
        },
      };

      const result = createCategorySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject categoryname shorter than 2 chars", () => {
      const invalid = {
        body: {
          categoryname: "A",
        },
      };

      const result = createCategorySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject categoryname longer than 255 chars", () => {
      const invalid = {
        body: {
          categoryname: "A".repeat(256),
        },
      };

      const result = createCategorySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject invalid UUID for parentid", () => {
      const invalid = {
        body: {
          categoryname: "Test",
          parentid: "not-a-uuid",
        },
      };

      const result = createCategorySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject missing categoryname", () => {
      const invalid = {
        body: {},
      };

      const result = createCategorySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("updateCategorySchema", () => {
    it("should accept valid update data", () => {
      const valid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          categoryname: "Updated Category",
        },
      };

      const result = updateCategorySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept update with parentid", () => {
      const valid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          parentid: "223e4567-e89b-12d3-a456-426614174000",
        },
      };

      const result = updateCategorySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject empty update body", () => {
      const invalid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {},
      };

      const result = updateCategorySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject invalid UUID in params", () => {
      const invalid = {
        params: {
          id: "not-a-uuid",
        },
        body: {
          categoryname: "Test",
        },
      };

      const result = updateCategorySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject categoryname shorter than 2 chars", () => {
      const invalid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          categoryname: "A",
        },
      };

      const result = updateCategorySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("categoryBooksSchema", () => {
    it("should accept valid params and query", () => {
      const valid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        query: {
          page: "1",
          limit: "10",
          search: "Test",
        },
      };

      const result = categoryBooksSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept empty query", () => {
      const valid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        query: {},
      };

      const result = categoryBooksSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID in params", () => {
      const invalid = {
        params: {
          id: "not-a-uuid",
        },
        query: {},
      };

      const result = categoryBooksSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});

