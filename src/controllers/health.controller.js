const { prisma } = require("../config/database.js");

const healthCheck = (_req, res) => {
  res.json({
    success: true,
    message: "OK",
    timestamp: new Date().toISOString(),
  });
};

const liveCheck = (_req, res) => {
  res.status(200).json({
    success: true,
    type: "liveness",
    message: "OK",
    timestamp: new Date().toISOString(),
  });
};

const readyCheck = async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      success: true,
      type: "readiness",
      message: "OK",
      db: "up",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      type: "readiness",
      message: "NOT READY",
      db: "down",
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = { healthCheck, liveCheck, readyCheck };
