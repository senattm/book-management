const {
  authorIdParamSchema,
  createAuthorSchema,
  updateAuthorSchema,
  listAuthorsSchema,
  listAuthorBooksSchema,
} = require("../../../validators/authors.validator");

describe("Authors Validators - Unit Tests", () => {
  describe("authorIdParamSchema", () => {
    it("should accept valid UUID", () => {
      const valid = {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      };

      const result = authorIdParamSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const invalid = {
        params: { id: "not-a-uuid" },
      };

      const result = authorIdParamSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("Geçerli bir yazar ID");
    });

    it("should reject empty string", () => {
      const invalid = {
        params: { id: "" },
      };

      const result = authorIdParamSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("createAuthorSchema", () => {
    it("should accept valid author data", () => {
      const valid = {
        body: {
          fullname: "George Orwell",
          bio: "English novelist and essayist",
        },
      };

      const result = createAuthorSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept author without bio", () => {
      const valid = {
        body: {
          fullname: "Jane Austen",
        },
      };

      const result = createAuthorSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should trim fullname", () => {
      const data = {
        body: {
          fullname: "  George Orwell  ",
        },
      };

      const result = createAuthorSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.body.fullname).toBe("George Orwell");
    });

    it("should reject fullname shorter than 2 chars", () => {
      const invalid = {
        body: {
          fullname: "A",
        },
      };

      const result = createAuthorSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("en az 2 karakter");
    });

    it("should reject fullname longer than 255 chars", () => {
      const invalid = {
        body: {
          fullname: "a".repeat(256),
        },
      };

      const result = createAuthorSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("en fazla 255");
    });

    it("should reject bio longer than 2000 chars", () => {
      const invalid = {
        body: {
          fullname: "Test Author",
          bio: "a".repeat(2001),
        },
      };

      const result = createAuthorSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("en fazla 2000");
    });

    it("should reject missing fullname", () => {
      const invalid = {
        body: {
          bio: "Some bio",
        },
      };

      const result = createAuthorSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("updateAuthorSchema", () => {
    it("should accept valid update data", () => {
      const valid = {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
        body: {
          fullname: "Updated Name",
        },
      };

      const result = updateAuthorSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept bio update", () => {
      const valid = {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
        body: {
          bio: "Updated bio",
        },
      };

      const result = updateAuthorSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept bio as null", () => {
      const valid = {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
        body: {
          bio: null,
        },
      };

      const result = updateAuthorSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept both fullname and bio", () => {
      const valid = {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
        body: {
          fullname: "New Name",
          bio: "New Bio",
        },
      };

      const result = updateAuthorSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject empty body", () => {
      const invalid = {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
        body: {},
      };

      const result = updateAuthorSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain(
        "en az 1 alan gönderilmelidir"
      );
    });

    it("should reject invalid UUID in params", () => {
      const invalid = {
        params: { id: "not-uuid" },
        body: { fullname: "Test" },
      };

      const result = updateAuthorSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject fullname shorter than 2 chars", () => {
      const invalid = {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
        body: { fullname: "A" },
      };

      const result = updateAuthorSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("listAuthorsSchema", () => {
    it("should accept valid query params", () => {
      const valid = {
        query: {
          page: "1",
          limit: "20",
          search: "Orwell",
        },
      };

      const result = listAuthorsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should use default values", () => {
      const data = {
        query: {},
      };

      const result = listAuthorsSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.query.page).toBe(1);
      expect(result.data.query.limit).toBe(10);
    });

    it("should coerce page to number", () => {
      const data = {
        query: { page: "5" },
      };

      const result = listAuthorsSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(typeof result.data.query.page).toBe("number");
      expect(result.data.query.page).toBe(5);
    });

    it("should reject page less than 1", () => {
      const invalid = {
        query: { page: "0" },
      };

      const result = listAuthorsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject limit greater than 100", () => {
      const invalid = {
        query: { limit: "101" },
      };

      const result = listAuthorsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should trim search query", () => {
      const data = {
        query: { search: "  Orwell  " },
      };

      const result = listAuthorsSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.query.search).toBe("Orwell");
    });
  });

  describe("listAuthorBooksSchema", () => {
    it("should accept valid params and query", () => {
      const valid = {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
        query: { page: "1", limit: "10" },
      };

      const result = listAuthorBooksSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should use default pagination", () => {
      const data = {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
        query: {},
      };

      const result = listAuthorBooksSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.query.page).toBe(1);
      expect(result.data.query.limit).toBe(10);
    });

    it("should reject invalid UUID", () => {
      const invalid = {
        params: { id: "not-uuid" },
        query: {},
      };

      const result = listAuthorBooksSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});