const logger = require("../utils/logger");

const loggerMiddleware = (req, res, next) => {
  const start = Date.now();

  res.once("finish", () => {
    const duration = Date.now() - start;
    const meta = {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id, 
    };

    const msg = `HTTP ${req.method} ${req.originalUrl}`;

    if (res.statusCode >= 400) {
      logger.error(msg, meta);
    } else {
      logger.info(msg, meta);
    }
  });

  next();
};

module.exports = loggerMiddleware;