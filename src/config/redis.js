const { createClient } = require("redis");

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redis = createClient({ url: redisUrl });

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

let connected = false;

async function initRedis() {
  if (connected) return;
  await redis.connect();
  connected = true;
  console.log("Redis connected");
}

module.exports = { redis, initRedis };
