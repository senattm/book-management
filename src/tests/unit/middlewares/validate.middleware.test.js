const { z } = require("zod");
const validate = require("../../../middlewares/validate.middleware");

describe("Validate Middleware - Unit Tests", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
    };
    res = {};
    next = jest.fn();
  });

  it("should pass valid request", () => {
    const schema = z.object({
      body: z.object({
        name: z.string().min(2),
      }),
    });

    req.body = { name: "Test" };
    const middleware = validate(schema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should update req.body with parsed data", () => {
    const schema = z.object({
      body: z.object({
        name: z.string().trim(),
      }),
    });

    req.body = { name: "  Test  " };
    const middleware = validate(schema);

    middleware(req, res, next);

    expect(req.body.name).toBe("Test");
    expect(next).toHaveBeenCalledWith();
  });

  it("should update req.query with parsed data", () => {
    const schema = z.object({
      query: z.object({
        page: z.coerce.number(),
      }),
    });

    req.query = { page: "1" };
    const middleware = validate(schema);

    middleware(req, res, next);

    expect(req.query.page).toBe(1);
    expect(next).toHaveBeenCalledWith();
  });

  it("should update req.params with parsed data", () => {
    const schema = z.object({
      params: z.object({
        id: z.string().uuid(),
      }),
    });

    req.params = { id: "123e4567-e89b-12d3-a456-426614174000" };
    const middleware = validate(schema);

    middleware(req, res, next);

    expect(req.params.id).toBe("123e4567-e89b-12d3-a456-426614174000");
    expect(next).toHaveBeenCalledWith();
  });

  it("should call next with error for invalid body", () => {
    const schema = z.object({
      body: z.object({
        name: z.string().min(2),
      }),
    });

    req.body = { name: "A" };
    const middleware = validate(schema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "Geçersiz input",
        details: expect.arrayContaining([
          expect.objectContaining({
            field: expect.any(String),
            message: expect.any(String),
          }),
        ]),
      })
    );
  });

  it("should call next with error for invalid query", () => {
    const schema = z.object({
      query: z.object({
        page: z.coerce.number().positive(),
      }),
    });

    req.query = { page: "-1" };
    const middleware = validate(schema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        code: "VALIDATION_ERROR",
      })
    );
  });

  it("should call next with error for invalid params", () => {
    const schema = z.object({
      params: z.object({
        id: z.string().uuid(),
      }),
    });

    req.params = { id: "not-a-uuid" };
    const middleware = validate(schema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        code: "VALIDATION_ERROR",
      })
    );
  });

  it("should include field path in error details", () => {
    const schema = z.object({
      body: z.object({
        email: z.string().email(),
        nested: z.object({
          value: z.number().positive(),
        }),
      }),
    });

    req.body = {
      email: "invalid-email",
      nested: { value: -1 },
    };
    const middleware = validate(schema);

    middleware(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "email",
          message: expect.any(String),
        }),
        expect.objectContaining({
          field: "nested.value",
          message: expect.any(String),
        }),
      ])
    );
  });

  it("should handle complex schema with all parts", () => {
    const schema = z.object({
      body: z.object({
        name: z.string(),
      }),
      query: z.object({
        page: z.string().optional(),
      }),
      params: z.object({
        id: z.string().uuid(),
      }),
    });

    req.body = { name: "Test" };
    req.query = { page: "1" };
    req.params = { id: "123e4567-e89b-12d3-a456-426614174000" };
    const middleware = validate(schema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("should preserve original values if not in schema", () => {
    const schema = z.object({
      body: z.object({
        name: z.string(),
      }),
    });

    req.body = { name: "Test", extra: "value" };
    req.query = { custom: "query" };
    const middleware = validate(schema);

    middleware(req, res, next);

    expect(req.body.name).toBe("Test");
    expect(req.query.custom).toBe("query");
    expect(next).toHaveBeenCalledWith();
  });

  it("should handle empty body", () => {
    const schema = z.object({
      body: z.object({}).optional(),
    });

    req.body = {};
    const middleware = validate(schema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("should handle null values in body", () => {
    const schema = z.object({
      body: z.object({
        value: z.string().nullable(),
      }),
    });

    req.body = { value: null };
    const middleware = validate(schema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});

