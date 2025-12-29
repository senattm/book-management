const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createUser(overrides = {}) {
  return prisma.users.create({
    data: {
      name: overrides.name ?? "Test User",
      email: overrides.email ?? `user_${Date.now()}@test.com`,
      password: overrides.password ?? "hashed_pw_dummy",
      role: overrides.role ?? "user",
    },
  });
}

async function createAuthor(overrides = {}) {
  return prisma.authors.create({
    data: {
      fullname: overrides.fullname ?? "Test Author",
      bio: overrides.bio ?? null,
    },
  });
}

async function createCategory(overrides = {}) {
  return prisma.categories.create({
    data: {
      categoryname: overrides.categoryname ?? "Test Category",
      parentid: overrides.parentid ?? null,
    },
  });
}

async function createBook(overrides = {}) {
  const author = overrides.authorid ? null : await createAuthor();
  const category = overrides.categoryid ? null : await createCategory();

  return prisma.books.create({
    data: {
      title: overrides.title ?? "Test Book",
      isbn: overrides.isbn ?? `978-${Date.now()}`,
      description: overrides.description ?? null,
      authorid: overrides.authorid ?? author.id,
      categoryid: overrides.categoryid ?? category.id,
      publishedat: overrides.publishedat ?? null,
      stock: overrides.stock ?? 0,
    },
  });
}

module.exports = { prisma, createUser, createAuthor, createCategory, createBook };
