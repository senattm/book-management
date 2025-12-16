require('dotenv').config();
const app = require('./app');
const { prisma, connectDB } = require('./config/database');

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    if (connectDB) await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
    });

    const gracefulShutdown = async () => {
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
