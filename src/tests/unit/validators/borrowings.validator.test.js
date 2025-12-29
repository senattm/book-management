const {
  borrowingIdParamSchema,
  createBorrowingSchema,
  listOverdueSchema,
  listBorrowingsSchema,
} = require("../../../validators/borrowings.validator");

describe("Borrowings Validators", () => {
  describe("borrowingIdParamSchema", () => {
    it("should fail when id is not uuid", () => {
      expect(() =>
        borrowingIdParamSchema.parse({
          params: { id: "invalid" },
        })
      ).toThrow();
    });

    it("should pass when id is uuid", () => {
      expect(() =>
        borrowingIdParamSchema.parse({
          params: { id: "123e4567-e89b-12d3-a456-426614174000" },
        })
      ).not.toThrow();
    });
  });

  describe("createBorrowingSchema", () => {
    it("should fail when bookid missing", () => {
      expect(() =>
        createBorrowingSchema.parse({
          body: { userid: "123e4567-e89b-12d3-a456-426614174000" },
        })
      ).toThrow();
    });

    it("should fail when bookid is invalid uuid", () => {
      expect(() =>
        createBorrowingSchema.parse({
          body: {
            bookid: "abc",
            userid: "123e4567-e89b-12d3-a456-426614174000",
          },
        })
      ).toThrow();
    });

    it("should pass with only bookid (userid optional, dueat optional)", () => {
      expect(() =>
        createBorrowingSchema.parse({
          body: {
            bookid: "123e4567-e89b-12d3-a456-426614174000",
          },
        })
      ).not.toThrow();
    });

    it("should fail when dueat is not datetime string", () => {
      expect(() =>
        createBorrowingSchema.parse({
          body: {
            bookid: "123e4567-e89b-12d3-a456-426614174000",
            dueat: "not-a-date",
          },
        })
      ).toThrow();
    });
  });

  describe("listOverdueSchema", () => {
    it("should pass with empty query", () => {
      expect(() => listOverdueSchema.parse({ query: {} })).not.toThrow();
    });

    it("should pass with page/limit as strings", () => {
      expect(() =>
        listOverdueSchema.parse({ query: { page: "1", limit: "10" } })
      ).not.toThrow();
    });
  });

  describe("listBorrowingsSchema", () => {
    it("should coerce page/limit to numbers and validate min/max", () => {
      const parsed = listBorrowingsSchema.parse({
        query: { page: "2", limit: "20" },
      });
      expect(parsed.query.page).toBe(2);
      expect(parsed.query.limit).toBe(20);
    });

    it("should fail when page < 1", () => {
      expect(() =>
        listBorrowingsSchema.parse({ query: { page: "0" } })
      ).toThrow();
    });

    it("should fail when limit > 100", () => {
      expect(() =>
        listBorrowingsSchema.parse({ query: { limit: "101" } })
      ).toThrow();
    });

    it("should fail when status invalid", () => {
      expect(() =>
        listBorrowingsSchema.parse({ query: { status: "xxx" } })
      ).toThrow();
    });

    it("should pass with status active/returned", () => {
      expect(() =>
        listBorrowingsSchema.parse({ query: { status: "active" } })
      ).not.toThrow();

      expect(() =>
        listBorrowingsSchema.parse({ query: { status: "returned" } })
      ).not.toThrow();
    });
  });
});
