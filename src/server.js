require("dotenv").config();

const app = require("./app");
const { prisma, connectDB } = require("./config/database");
const { initRedis, redis } = require("./config/redis");

const PORT = Number(process.env.PORT || 3000);

let server;

/**
 * Uygulamayı başlatır (prod/dev).
 * Testte bunu çağırmıyoruz.
 */
async function start() {
  // Jest ortamında kesinlikle server ayağa kalkmasın
  if (process.env.NODE_ENV === "test") return null;

  if (typeof connectDB === "function") {
    await connectDB();
  }

  // Redis opsiyonel olsun (testte/yerelde kapatabil)
  if (typeof initRedis === "function" && process.env.REDIS_DISABLED !== "true") {
    await initRedis();
  }

  server = app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const gracefulShutdown = async () => {
    try {
      if (redis?.isOpen) await redis.quit();
    } catch (_) {}

    try {
      await prisma?.$disconnect();
    } catch (_) {}

    if (server) {
      server.close(() => process.exit(0));
    } else {
      process.exit(0);
    }
  };

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);

  return server;
}

/**
 * Bu dosya `node src/server.js` ile çalıştırılırsa başlat.
 * Jest testleri `require(app)` yaptığında başlatma.
 */
if (require.main === module) {
  start().catch((err) => {
    console.error("Uygulama başlatılamadı:", err);
    process.exit(1);
  });
}

module.exports = { app, start };
