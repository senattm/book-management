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

function signToken({ id, role }) {
  return jwt.sign({ id, role, type: "access" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
}

async function resetDb() {
  await prisma.reviews.deleteMany();
  await prisma.borrowings.deleteMany();
  await prisma.books.deleteMany();
  await prisma.categories.deleteMany();
  await prisma.authors.deleteMany();
  await prisma.users.deleteMany();
}

async function createFixtures() {
  const admin = await prisma.users.create({
    data: { name: "Admin", email: "admin@test.com", password: "hashed", role: "admin" },
  });
  const user = await prisma.users.create({
    data: { name: "User", email: "user@test.com", password: "hashed", role: "user" },
  });

  const author = await prisma.authors.create({
    data: { fullname: "Test Author", bio: "Bio" },
  });

  const category = await prisma.categories.create({
    data: { categoryname: "Test Category" },
  });

  const book = await prisma.books.create({
    data: {
      title: "Borrow Book",
      isbn: "9780451524935",
      authorid: author.id,
      categoryid: category.id,
      stock: 2,
    },
  });

  return {
    admin,
    user,
    author,
    category,
    book,
    adminToken: signToken({ id: admin.id, role: admin.role }),
    userToken: signToken({ id: user.id, role: user.role }),
  };
}

describe("BORROWINGS API - Integration Tests", () => {
  let adminToken, userToken;
  let admin, user, book;

  beforeAll(async () => {
    await resetDb();
    const fx = await createFixtures();
    adminToken = fx.adminToken;
    userToken = fx.userToken;
    admin = fx.admin;
    user = fx.user;
    book = fx.book;
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  describe("POST /api/v1/borrowings", () => {
    it("should deny unauthenticated", async () => {
      const res = await request(app).post("/api/v1/borrowings").send({ bookid: book.id });
      expect(res.status).toBe(401);
    });

    it("should create borrowing for self (user)", async () => {
      const dbUser = await prisma.users.findFirst({ where: { id: user.id, deletedat: null } });
      if (!dbUser) {
        user = await prisma.users.create({
          data: { name: "User", email: `user_${Date.now()}@test.com`, password: "hashed", role: "user" },
        });
        userToken = signToken({ id: user.id, role: "user", type: "access" });
      }
      
      const author = await prisma.authors.create({
        data: { fullname: "Self Borrow Author" },
      });
      const category = await prisma.categories.create({
        data: { categoryname: "Self Borrow Category" },
      });
      const testBook = await prisma.books.create({
        data: {
          title: "Self Borrow Book",
          isbn: `978-${Date.now()}`,
          authorid: author.id,
          categoryid: category.id,
          stock: 2,
        },
      });

      const res = await request(app)
        .post("/api/v1/borrowings")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ bookid: testBook.id });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.userid).toBe(user.id);
      expect(res.body.data.bookid).toBe(testBook.id);

      const updatedBook = await prisma.books.findFirst({ where: { id: testBook.id } });
      expect(updatedBook.stock).toBe(1);
    });

    it("should forbid user creating borrowing for someone else", async () => {
      const res = await request(app)
        .post("/api/v1/borrowings")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ bookid: book.id, userid: admin.id });

      expect(res.status).toBe(403);
    });

    it("should allow admin creating borrowing for another user", async () => {
      const dbUser = await prisma.users.findFirst({ where: { id: user.id, deletedat: null } });
      if (!dbUser) {
        user = await prisma.users.create({
          data: { name: "User", email: `user2_${Date.now()}@test.com`, password: "hashed", role: "user" },
        });
      }

      const author = await prisma.authors.create({
        data: { fullname: "Admin Borrow Author" },
      });
      const category = await prisma.categories.create({
        data: { categoryname: "Admin Borrow Category" },
      });
      
      const newBook = await prisma.books.create({
        data: {
          title: "Admin Borrow Book",
          isbn: `978-${Date.now()}`,
          authorid: author.id,
          categoryid: category.id,
          stock: 1,
        },
      });

      const res = await request(app)
        .post("/api/v1/borrowings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ bookid: newBook.id, userid: user.id });

      expect(res.status).toBe(201);
      expect(res.body.data.userid).toBe(user.id);

      const updatedBook = await prisma.books.findFirst({ where: { id: newBook.id } });
      expect(updatedBook.stock).toBe(0);
    });

    it("should fail when stock is 0", async () => {
      const author = await prisma.authors.create({
        data: { fullname: "Zero Stock Author" },
      });
      const category = await prisma.categories.create({
        data: { categoryname: "Zero Stock Category" },
      });
      
      const zeroStockBook = await prisma.books.create({
        data: {
          title: "Zero Stock Book",
          isbn: `978-${Date.now() + 1}`,
          authorid: author.id,
          categoryid: category.id,
          stock: 0,
        },
      });

      const res = await request(app)
        .post("/api/v1/borrowings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ bookid: zeroStockBook.id, userid: user.id });

      expect(res.status).toBe(400);
    });

    it("should return 400 when bookid invalid uuid (validation)", async () => {
      const res = await request(app)
        .post("/api/v1/borrowings")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ bookid: "invalid" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/borrowings", () => {
    it("should list my borrowings (user)", async () => {
      const res = await request(app)
        .get("/api/v1/borrowings?page=1&limit=10")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("pagination");
    });

    it("should filter by status=active", async () => {
      const res = await request(app)
        .get("/api/v1/borrowings?status=active")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
    });

    it("should reject invalid pagination (page=0)", async () => {
      const res = await request(app)
        .get("/api/v1/borrowings?page=0")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/borrowings/overdue", () => {
    it("should forbid non-admin", async () => {
      const res = await request(app)
        .get("/api/v1/borrowings/overdue")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it("should allow admin (even if empty)", async () => {
      const res = await request(app)
        .get("/api/v1/borrowings/overdue?page=1&limit=10")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items || res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("pagination");
    });
  });

  describe("PUT /api/v1/borrowings/:id/return", () => {
    it("should return 400 for invalid uuid param", async () => {
      const res = await request(app)
        .put("/api/v1/borrowings/invalid/return")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent borrowing", async () => {
      const fakeId = "123e4567-e89b-12d3-a456-426614174000";
      const res = await request(app)
        .put(`/api/v1/borrowings/${fakeId}/return`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it("should return borrowing and increment stock", async () => {
      const dbUser = await prisma.users.findFirst({ where: { id: user.id, deletedat: null } });
      if (!dbUser) {
        user = await prisma.users.create({
          data: { name: "User", email: `user3_${Date.now()}@test.com`, password: "hashed", role: "user" },
        });
        userToken = signToken({ id: user.id, role: "user", type: "access" });
      }

      const author = await prisma.authors.create({
        data: { fullname: "Return Test Author" },
      });
      const category = await prisma.categories.create({
        data: { categoryname: "Return Test Category" },
      });

      const newBook = await prisma.books.create({
        data: {
          title: "Return Book",
          isbn: "9780451524999",
          authorid: author.id,
          categoryid: category.id,
          stock: 1,
        },
      });

      const created = await request(app)
        .post("/api/v1/borrowings")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ bookid: newBook.id });

      expect(created.status).toBe(201);
      const borrowingId = created.body.data.id;

      const res = await request(app)
        .put(`/api/v1/borrowings/${borrowingId}/return`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.returnedat).toBeTruthy();

      const updatedBook = await prisma.books.findFirst({ where: { id: newBook.id } });
      expect(updatedBook.stock).toBe(1);
    });

    it("should forbid returning someone else borrowing (user)", async () => {
      const dbAdmin = await prisma.users.findFirst({ where: { id: admin.id, deletedat: null } });
      const dbUser = await prisma.users.findFirst({ where: { id: user.id, deletedat: null } });
      if (!dbAdmin) {
        admin = await prisma.users.create({
          data: { name: "Admin", email: `admin2_${Date.now()}@test.com`, password: "hashed", role: "admin" },
        });
        adminToken = signToken({ id: admin.id, role: "admin", type: "access" });
      }
      if (!dbUser) {
        user = await prisma.users.create({
          data: { name: "User", email: `user4_${Date.now()}@test.com`, password: "hashed", role: "user" },
        });
        userToken = signToken({ id: user.id, role: "user", type: "access" });
      }
      
      const author = await prisma.authors.create({
        data: { fullname: "Other Borrow Author" },
      });
      const category = await prisma.categories.create({
        data: { categoryname: "Other Borrow Category" },
      });

      const book2 = await prisma.books.create({
        data: {
          title: "Other Borrow",
          isbn: "9780451524001",
          authorid: author.id,
          categoryid: category.id,
          stock: 1,
        },
      });

      const created = await request(app)
        .post("/api/v1/borrowings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ bookid: book2.id, userid: admin.id });

      expect(created.status).toBe(201);

      const res = await request(app)
        .put(`/api/v1/borrowings/${created.body.data.id}/return`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});
