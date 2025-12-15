require('dotenv').config();
const app = require('./app');
const { connectDB, prisma } = require('./config/database');

const PORT = process.env.PORT || 3000;

(async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
  });

  const gracefulShutdown = async () => {
    await prisma.$disconnect();
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
})();
