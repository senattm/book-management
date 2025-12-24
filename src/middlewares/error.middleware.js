const logger = require("../utils/logger");
const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  const defaultCodeByStatus = {
    400: "VALIDATION_ERROR",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    429: "RATE_LIMIT",
    500: "INTERNAL_SERVER_ERROR",
  };

  const errorCode =
    err.code || defaultCodeByStatus[statusCode] || "INTERNAL_SERVER_ERROR";

  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: err.message || "Sunucu tarafında bir hata oluştu.",
      details: err.details || [],
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };

 logger.error(`[ERROR] ${errorCode}: ${err.message}`, {
    path: req.originalUrl,
    stack: err.stack,
    details: err.details
  });
  return res.status(statusCode).json(errorResponse);
};

module.exports = errorMiddleware;
