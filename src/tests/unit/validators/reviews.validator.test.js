const {
  reviewIdParamSchema,
  createReviewSchema,
  updateReviewSchema,
  getAllReviewsSchema,
} = require("../../../validators/reviews.validator");

describe("Reviews Validators - Unit Tests", () => {
  describe("reviewIdParamSchema", () => {
    it("should accept valid UUID", () => {
      const valid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
      };

      const result = reviewIdParamSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const invalid = {
        params: {
          id: "not-a-uuid",
        },
      };

      const result = reviewIdParamSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const invalid = {
        params: {},
      };

      const result = reviewIdParamSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("createReviewSchema", () => {
    it("should accept valid review data", () => {
      const valid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          rating: 5,
          comment: "Great book!",
        },
      };

      const result = createReviewSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept review without comment", () => {
      const valid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          rating: 4,
        },
      };

      const result = createReviewSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept string rating and coerce to number", () => {
      const valid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          rating: "5",
        },
      };

      const result = createReviewSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.body.rating).toBe("number");
      }
    });

    it("should reject rating less than 1", () => {
      const invalid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          rating: 0,
        },
      };

      const result = createReviewSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject rating greater than 5", () => {
      const invalid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          rating: 6,
        },
      };

      const result = createReviewSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer rating", () => {
      const invalid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          rating: 4.5,
        },
      };

      const result = createReviewSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject empty comment", () => {
      const invalid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          rating: 5,
          comment: "",
        },
      };

      const result = createReviewSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject invalid book ID UUID", () => {
      const invalid = {
        params: {
          id: "not-a-uuid",
        },
        body: {
          rating: 5,
        },
      };

      const result = createReviewSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject missing rating", () => {
      const invalid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {},
      };

      const result = createReviewSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("updateReviewSchema", () => {
    it("should accept valid update data with rating", () => {
      const valid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          rating: 4,
        },
      };

      const result = updateReviewSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept valid update data with comment", () => {
      const valid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          comment: "Updated comment",
        },
      };

      const result = updateReviewSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept update with both rating and comment", () => {
      const valid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          rating: 5,
          comment: "Updated comment",
        },
      };

      const result = updateReviewSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept null comment", () => {
      const valid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          comment: null,
        },
      };

      const result = updateReviewSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject empty update body", () => {
      const invalid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {},
      };

      const result = updateReviewSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject rating less than 1", () => {
      const invalid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          rating: 0,
        },
      };

      const result = updateReviewSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject rating greater than 5", () => {
      const invalid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          rating: 6,
        },
      };

      const result = updateReviewSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject empty comment string", () => {
      const invalid = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
        body: {
          comment: "",
        },
      };

      const result = updateReviewSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject invalid review ID UUID", () => {
      const invalid = {
        params: {
          id: "not-a-uuid",
        },
        body: {
          rating: 4,
        },
      };

      const result = updateReviewSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("getAllReviewsSchema", () => {
    it("should accept valid query params", () => {
      const valid = {
        query: {
          page: 1,
          limit: 10,
          bookId: "123e4567-e89b-12d3-a456-426614174000",
          userId: "223e4567-e89b-12d3-a456-426614174000",
        },
      };

      const result = getAllReviewsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept empty query", () => {
      const valid = {
        query: {},
      };

      const result = getAllReviewsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should coerce string page to number", () => {
      const valid = {
        query: {
          page: "2",
        },
      };

      const result = getAllReviewsSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.query.page).toBe("number");
      }
    });

    it("should reject invalid UUID for bookId", () => {
      const invalid = {
        query: {
          bookId: "not-a-uuid",
        },
      };

      const result = getAllReviewsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject invalid UUID for userId", () => {
      const invalid = {
        query: {
          userId: "not-a-uuid",
        },
      };

      const result = getAllReviewsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject negative page", () => {
      const invalid = {
        query: {
          page: -1,
        },
      };

      const result = getAllReviewsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject limit greater than 100", () => {
      const invalid = {
        query: {
          limit: 101,
        },
      };

      const result = getAllReviewsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});

