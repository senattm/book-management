jest.mock("../../../utils/logger", () => ({
  error: jest.fn(),
}));

const errorMiddleware = require("../../../middlewares/error.middleware");
const logger = require("../../../utils/logger");

describe("Error Middleware - Unit Tests", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      originalUrl: "/api/v1/test",
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should handle error with statusCode", () => {
    const err = new Error("Test error");
    err.statusCode = 404;
    err.code = "NOT_FOUND";

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Test error",
        details: [],
      },
      timestamp: expect.any(String),
      path: "/api/v1/test",
    });
    expect(logger.error).toHaveBeenCalled();
  });

  it("should use default code by statusCode", () => {
    const err = new Error("Validation error");
    err.statusCode = 400;

    errorMiddleware(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: "VALIDATION_ERROR",
        }),
      })
    );
  });

  it("should handle 401 statusCode with UNAUTHORIZED code", () => {
    const err = new Error("Unauthorized");
    err.statusCode = 401;

    errorMiddleware(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: "UNAUTHORIZED",
        }),
      })
    );
  });

  it("should handle 403 statusCode with FORBIDDEN code", () => {
    const err = new Error("Forbidden");
    err.statusCode = 403;

    errorMiddleware(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: "FORBIDDEN",
        }),
      })
    );
  });

  it("should handle 409 statusCode with CONFLICT code", () => {
    const err = new Error("Conflict");
    err.statusCode = 409;

    errorMiddleware(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: "CONFLICT",
        }),
      })
    );
  });

  it("should handle 429 statusCode with RATE_LIMIT code", () => {
    const err = new Error("Rate limit exceeded");
    err.statusCode = 429;

    errorMiddleware(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: "RATE_LIMIT",
        }),
      })
    );
  });

  it("should handle 500 statusCode with INTERNAL_SERVER_ERROR code", () => {
    const err = new Error("Internal error");
    err.statusCode = 500;

    errorMiddleware(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: "INTERNAL_SERVER_ERROR",
        }),
      })
    );
  });

  it("should use default message if error message is missing", () => {
    const err = {};
    err.statusCode = 500;

    errorMiddleware(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: "Sunucu tarafında bir hata oluştu.",
        }),
      })
    );
  });

  it("should include error details if provided", () => {
    const err = new Error("Validation error");
    err.statusCode = 400;
    err.details = [{ field: "email", message: "Invalid email" }];

    errorMiddleware(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          details: [{ field: "email", message: "Invalid email" }],
        }),
      })
    );
  });

  it("should use INTERNAL_SERVER_ERROR for unknown statusCode", () => {
    const err = new Error("Unknown error");
    err.statusCode = 999;

    errorMiddleware(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: "INTERNAL_SERVER_ERROR",
        }),
      })
    );
  });

  it("should log error with stack trace", () => {
    const err = new Error("Test error");
    err.statusCode = 500;
    err.stack = "Error stack trace";

    errorMiddleware(err, req, res, next);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Test error"),
      expect.objectContaining({
        path: "/api/v1/test",
        stack: "Error stack trace",
      })
    );
  });
});

