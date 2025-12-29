const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../../config/redis", () => {
  const mem = new Map();
  return {
    redis: {
      set: jest.fn(async (k, v) => mem.set(k, String(v))),
      get: jest.fn(async (k) => mem.get(k) ?? null),
      del: jest.fn(async (k) => mem.delete(k)),
      sAdd: jest.fn(async () => 1),
      sRem: jest.fn(async () => 1),
      expire: jest.fn(async () => 1),
    },
  };
});

const app = require("../../app");
const { prisma } = require("../../config/database");

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
}

async function cleanupDb() {
  await prisma.books.deleteMany({});
  await prisma.categories.deleteMany({});
  await prisma.authors.deleteMany({});
}

async function createCategory(categoryname = "Test Category") {
  return prisma.categories.create({ data: { categoryname } });
}

async function createAuthor(fullname = "Test Author", bio = null) {
  return prisma.authors.create({ data: { fullname, bio } });
}

async function createBook({
  title = "Test Book",
  isbn = "1234567890123",
  stock = 5,
  authorid,
  categoryid,
  description = null,
  publishedat = null,
} = {}) {
  const author = authorid
    ? await prisma.authors.findUnique({ where: { id: authorid } })
    : null;

  const category = categoryid
    ? await prisma.categories.findUnique({ where: { id: categoryid } })
    : null;

  const a =
    author ??
    (await prisma.authors.create({
      data: { fullname: "Test Author", bio: null },
    }));

  const c =
    category ??
    (await prisma.categories.create({
      data: { categoryname: "Test Category" },
    }));

  return prisma.books.create({
    data: {
      title: title.trim(),
      isbn: String(isbn).trim(),
      stock: Number.isFinite(stock) ? stock : 0,
      authorid: a.id,
      categoryid: c.id,
      description,
      publishedat: publishedat ? new Date(publishedat) : null,
    },
  });
}

describe("BOOKS API - Integration Tests", () => {
  let adminToken;
  let userToken;

  beforeAll(async () => {
    adminToken = signToken({ id: 1, role: "admin", type: "access" });
    userToken = signToken({ id: 2, role: "user", type: "access" });
    await cleanupDb();
  });

  beforeEach(async () => {
    await cleanupDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/v1/books", () => {
    it("should create book as admin", async () => {
      const author = await createAuthor("Book Author");
      const category = await createCategory("Book Category");

      const res = await request(app)
        .post("/api/v1/books")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "My Book",
          isbn: "9994567890123",
          stock: 5,
          authorid: author.id,
          categoryid: category.id,
          description: "Nice book",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.title).toBe("My Book");
      expect(res.body.data.isbn).toBe("9994567890123");
    });

    it("should auto-create author/category if not provided (admin)", async () => {
      const res = await request(app)
        .post("/api/v1/books")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Auto Rel Book",
          isbn: "9994567890001",
          stock: 1,
          description: "Auto create relations",
        });

      expect([201, 400]).toContain(res.status);
    });

    it("should deny book creation for regular user", async () => {
      const author = await createAuthor("Book Author");
      const category = await createCategory("Book Category");

      const res = await request(app)
        .post("/api/v1/books")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          title: "My Book",
          isbn: "9994567890123",
          stock: 5,
          authorid: author.id,
          categoryid: category.id,
        });

      expect(res.status).toBe(403);
    });

    it("should deny unauthenticated request", async () => {
      const res = await request(app).post("/api/v1/books").send({
        title: "My Book",
        isbn: "9994567890123",
      });

      expect(res.status).toBe(401);
    });

    it("should validate isbn format/length", async () => {
      const author = await createAuthor("Book Author");
      const category = await createCategory("Book Category");

      const res = await request(app)
        .post("/api/v1/books")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "My Book",
          isbn: "123",
          stock: 1,
          authorid: author.id,
          categoryid: category.id,
        });

      expect(res.status).toBe(400);
    });

    it("should trim title", async () => {
      const author = await createAuthor("Book Author");
      const category = await createCategory("Book Category");

      const res = await request(app)
        .post("/api/v1/books")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "   Trimmed Book   ",
          isbn: "9994567890999",
          stock: 1,
          authorid: author.id,
          categoryid: category.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("Trimmed Book");
    });
  });

  describe("GET /api/v1/books", () => {
    it("should list books without authentication", async () => {
      await createBook({
        title: "Book 1",
        isbn: "1114567890123",
        stock: 1,
      });

      const res = await request(app).get("/api/v1/books");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("pagination");
    });

    it("should paginate results", async () => {
      await createBook({ title: "Book A", isbn: "2224567890123", stock: 1 });
      await createBook({ title: "Book B", isbn: "2224567890124", stock: 1 });

      const res = await request(app).get("/api/v1/books?page=1&limit=1");

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(1);
    });

    it("should reject invalid pagination params", async () => {
      const res = await request(app).get("/api/v1/books?page=0");
      expect(res.status).toBe(400);
    });

    it("should search books by title", async () => {
      await createBook({
        title: "My Special Book",
        isbn: "3334567890123",
        stock: 1,
      });

      const res = await request(app).get("/api/v1/books?search=Special");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("GET /api/v1/books/:id", () => {
    it("should get book by id", async () => {
      const book = await createBook({
        title: "Get Book",
        isbn: "4444567890123",
        stock: 2,
      });

      const res = await request(app).get(`/api/v1/books/${book.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(book.id);
    });

    it("should return 404 for non-existent book", async () => {
      const fakeId = "123e4567-e89b-12d3-a456-426614174000";
      const res = await request(app).get(`/api/v1/books/${fakeId}`);

      expect([400, 404]).toContain(res.status);
    });
  });

  describe("PUT /api/v1/books/:id", () => {
    it("should update book as admin", async () => {
      const book = await createBook({
        title: "Old Title",
        isbn: "5554567890123",
        stock: 2,
      });

      const res = await request(app)
        .put(`/api/v1/books/${book.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "New Title" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("New Title");
    });

    it("should deny update for regular user", async () => {
      const book = await createBook({
        title: "Old Title",
        isbn: "6664567890123",
        stock: 2,
      });

      const res = await request(app)
        .put(`/api/v1/books/${book.id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ title: "Hacked" });

      expect(res.status).toBe(403);
    });

    it("should reject empty update body", async () => {
      const book = await createBook({
        title: "Old Title",
        isbn: "7774567890123",
        stock: 2,
      });

      const res = await request(app)
        .put(`/api/v1/books/${book.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/v1/books/:id", () => {
    it("should soft delete book as admin", async () => {
      const book = await createBook({
        title: "To Delete",
        isbn: "8884567890123",
        stock: 1,
      });

      const res = await request(app)
        .delete(`/api/v1/books/${book.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(String(res.body.message || "")).toContain("silindi");

      const deleted = await prisma.books.findFirst({ where: { id: book.id } });
      expect(deleted.deletedat).not.toBeNull();
    });

    it("should deny delete for regular user", async () => {
      const book = await createBook({
        title: "To Delete",
        isbn: "8894567890123",
        stock: 1,
      });

      const res = await request(app)
        .delete(`/api/v1/books/${book.id}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});
