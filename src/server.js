(async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
    });

    const gracefulShutdown = async () => {
      console.log('Sunucu kapatılıyor...');
      await prisma.$disconnect();
      server.close(() => {
        console.log('Bağlantılar kesildi, süreç sonlandırıldı.');
        process.exit(0);
      });
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

  } catch (error) {
    console.error("Uygulama başlatılamadı:", error);
    process.exit(1); 
  }
})();