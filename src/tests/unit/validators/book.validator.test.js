const {
  createBookSchema,
  listBooksSchema,
  bookIdParamSchema,
  updateBookSchema,
} = require("../../../validators/book.validator");

describe("Book Validators - Unit Tests", () => {
  describe("createBookSchema", () => {
    it("should accept valid book data", () => {
      const valid = {
        body: {
          title: "Clean Code",
          isbn: "9780132350884",
          authorid: "123e4567-e89b-12d3-a456-426614174000",
          categoryid: "123e4567-e89b-12d3-a456-426614174001",
          stock: 5,
          description: "Nice book",
        },
      };

      const result = createBookSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should trim title and isbn", () => {
      const data = {
        body: {
          title: "   Clean Code   ",
          isbn: " 978-0132350884 ",
          authorid: "123e4567-e89b-12d3-a456-426614174000",
          categoryid: "123e4567-e89b-12d3-a456-426614174001",
          stock: 0,
        },
      };

      const result = createBookSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.body.title).toBe("Clean Code");
      expect(result.data.body.isbn).toBe("978-0132350884");
    });

    it("should reject missing title", () => {
      const invalid = {
        body: {
          isbn: "9780132350884",
          authorid: "123e4567-e89b-12d3-a456-426614174000",
          categoryid: "123e4567-e89b-12d3-a456-426614174001",
          stock: 0,
        },
      };

      const result = createBookSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBeDefined();
    });

    it("should reject invalid isbn", () => {
      const invalid = {
        body: {
          title: "Bad ISBN",
          isbn: "123",
          authorid: "123e4567-e89b-12d3-a456-426614174000",
          categoryid: "123e4567-e89b-12d3-a456-426614174001",
          stock: 0,
        },
      };

      const result = createBookSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("Geçersiz ISBN");
    });

    it("should reject invalid authorid uuid", () => {
      const invalid = {
        body: {
          title: "Test",
          isbn: "9780132350884",
          authorid: "not-uuid",
          categoryid: "123e4567-e89b-12d3-a456-426614174001",
          stock: 0,
        },
      };

      const result = createBookSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("Geçerli bir yazar ID");
    });

    it("should reject negative stock", () => {
      const invalid = {
        body: {
          title: "Test",
          isbn: "9780132350884",
          authorid: "123e4567-e89b-12d3-a456-426614174000",
          categoryid: "123e4567-e89b-12d3-a456-426614174001",
          stock: -1,
        },
      };

      const result = createBookSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("negatif");
    });

    it("should reject publishedat in the future", () => {
      const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const invalid = {
        body: {
          title: "Future Book",
          isbn: "9780132350884",
          authorid: "123e4567-e89b-12d3-a456-426614174000",
          categoryid: "123e4567-e89b-12d3-a456-426614174001",
          stock: 0,
          publishedat: future,
        },
      };

      const result = createBookSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("gelecek");
    });
  });

  describe("listBooksSchema", () => {
    it("should accept valid query params", () => {
      const valid = {
        query: {
          page: "1",
          limit: "10",
          search: "Clean",
          authorid: "123e4567-e89b-12d3-a456-426614174000",
          categoryid: "123e4567-e89b-12d3-a456-426614174001",
        },
      };

      const result = listBooksSchema.safeParse(valid);
      expect(result.success).toBe(true);
      expect(result.data.query.page).toBe(1);
      expect(result.data.query.limit).toBe(10);
    });

    it("should use default values", () => {
      const data = { query: {} };
      const result = listBooksSchema.safeParse(data);

      expect(result.success).toBe(true);
      expect(result.data.query.page).toBe(1);
      expect(result.data.query.limit).toBe(10);
    });

    it("should reject page less than 1", () => {
      const invalid = { query: { page: "0" } };
      const result = listBooksSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject limit greater than 100", () => {
      const invalid = { query: { limit: "101" } };
      const result = listBooksSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should trim search", () => {
      const data = { query: { search: "  Clean  " } };
      const result = listBooksSchema.safeParse(data);

      expect(result.success).toBe(true);
      expect(result.data.query.search).toBe("Clean");
    });
  });

  describe("bookIdParamSchema", () => {
    it("should accept valid UUID", () => {
      const valid = { params: { id: "123e4567-e89b-12d3-a456-426614174000" } };
      const result = bookIdParamSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const invalid = { params: { id: "not-uuid" } };
      const result = bookIdParamSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain("Geçerli bir kitap ID");
    });
  });

  describe("updateBookSchema", () => {
    it("should accept valid update", () => {
      const valid = {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
        body: { title: "Updated Title" },
      };

      const result = updateBookSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept nullable fields", () => {
      const valid = {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
        body: { description: null, publishedat: null },
      };

      const result = updateBookSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject empty body", () => {
      const invalid = {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
        body: {},
      };

      const result = updateBookSchema.safeParse(invalid);
      expect(result.success).toBe(false);

      expect(result.error.issues[0].message).toContain("en az 1 alan");
    });

    it("should reject invalid isbn on update", () => {
      const invalid = {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
        body: { isbn: "12" },
      };

      const result = updateBookSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
