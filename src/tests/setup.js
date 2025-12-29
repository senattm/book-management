const path = require("path");
const { execSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");

require("dotenv").config({ path: path.join(process.cwd(), ".env.test") });

const prisma = new PrismaClient();

beforeAll(async () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("NODE_ENV test değil! Yanlışlıkla prod/dev DB silmeyelim.");
  }
  if (!process.env.DATABASE_URL?.includes("test")) {
    throw new Error("DATABASE_URL test DB gibi görünmüyor! (içinde 'test' yok)");
  }

  execSync(`npx dotenv -e .env.test -- npx prisma migrate deploy`, {
    stdio: "inherit",
  });
});

beforeEach(async () => {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "borrowings",
      "reviews",
      "books",
      "categories",
      "authors",
      "users"
    RESTART IDENTITY CASCADE;
  `);
});

afterAll(async () => {
  await prisma.$disconnect();
});
