require('dotenv').config();
const app = require('./app');
const { prisma, connectDB } = require('./config/database');
const {initRedis, redis } = require('./config/redis');

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    if (connectDB) await connectDB();

    await initRedis();

    const server = app.listen(PORT, () => {
      console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
    });

    const gracefulShutdown = async () => {
      try {await redis?.quit(); } catch(_){}
      await prisma?.$disconnect();
      server.close(() => process.exit(0));
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  } catch (err) {
    console.error('Uygulama başlatılamadı:', err);
    process.exit(1);
  }
})();
