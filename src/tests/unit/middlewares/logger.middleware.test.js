jest.mock("../../../utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const loggerMiddleware = require("../../../middlewares/logger.middleware");
const logger = require("../../../utils/logger");

describe("Logger Middleware - Unit Tests", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: "GET",
      originalUrl: "/api/v1/test",
      ip: "127.0.0.1",
      user: null,
    };
    res = {
      statusCode: 200,
      once: jest.fn((event, callback) => {
        if (event === "finish") {
          setTimeout(() => callback(), 10);
        }
      }),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should call next immediately", () => {
    loggerMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("should log info for successful requests", (done) => {
    res.statusCode = 200;
    loggerMiddleware(req, res, next);

    setTimeout(() => {
      expect(logger.info).toHaveBeenCalledWith(
        "HTTP GET /api/v1/test",
        expect.objectContaining({
          method: "GET",
          path: "/api/v1/test",
          statusCode: 200,
          duration: expect.any(String),
          ip: "127.0.0.1",
        })
      );
      expect(logger.error).not.toHaveBeenCalled();
      done();
    }, 20);
  });

  it("should log error for failed requests", (done) => {
    res.statusCode = 404;
    loggerMiddleware(req, res, next);

    setTimeout(() => {
      expect(logger.error).toHaveBeenCalledWith(
        "HTTP GET /api/v1/test",
        expect.objectContaining({
          method: "GET",
          path: "/api/v1/test",
          statusCode: 404,
          duration: expect.any(String),
          ip: "127.0.0.1",
        })
      );
      expect(logger.info).not.toHaveBeenCalled();
      done();
    }, 20);
  });

  it("should log error for 500 status code", (done) => {
    res.statusCode = 500;
    loggerMiddleware(req, res, next);

    setTimeout(() => {
      expect(logger.error).toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
      done();
    }, 20);
  });

  it("should include userId if user is authenticated", (done) => {
    req.user = { id: "user-uuid" };
    res.statusCode = 200;
    loggerMiddleware(req, res, next);

    setTimeout(() => {
      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userId: "user-uuid",
        })
      );
      done();
    }, 20);
  });

  it("should not include userId if user is not authenticated", (done) => {
    req.user = null;
    res.statusCode = 200;
    loggerMiddleware(req, res, next);

    setTimeout(() => {
      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userId: undefined,
        })
      );
      done();
    }, 20);
  });

  it("should calculate duration correctly", (done) => {
    res.statusCode = 200;
    loggerMiddleware(req, res, next);

    setTimeout(() => {
      const callArgs = logger.info.mock.calls[0][1];
      expect(callArgs.duration).toMatch(/\d+ms/);
      done();
    }, 20);
  });

  it("should handle different HTTP methods", (done) => {
    req.method = "POST";
    res.statusCode = 201;
    loggerMiddleware(req, res, next);

    setTimeout(() => {
      expect(logger.info).toHaveBeenCalledWith(
        "HTTP POST /api/v1/test",
        expect.objectContaining({
          method: "POST",
          statusCode: 201,
        })
      );
      done();
    }, 20);
  });

  it("should handle PUT method", (done) => {
    req.method = "PUT";
    res.statusCode = 200;
    loggerMiddleware(req, res, next);

    setTimeout(() => {
      expect(logger.info).toHaveBeenCalledWith(
        "HTTP PUT /api/v1/test",
        expect.any(Object)
      );
      done();
    }, 20);
  });

  it("should handle DELETE method", (done) => {
    req.method = "DELETE";
    res.statusCode = 200;
    loggerMiddleware(req, res, next);

    setTimeout(() => {
      expect(logger.info).toHaveBeenCalledWith(
        "HTTP DELETE /api/v1/test",
        expect.any(Object)
      );
      done();
    }, 20);
  });
});

