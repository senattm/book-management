const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../../config/redis", () => {
  const mem = new Map();
  return {
    redis: {
      set: jest.fn(async (k, v) => { mem.set(k, String(v)); }),
      get: jest.fn(async (k) => mem.get(k) ?? null),
      del: jest.fn(async (k) => { mem.delete(k); }),
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

async function createCategory(categoryname = "Test Category") {
  return prisma.categories.create({ data: { categoryname } });
}

async function createAuthor(fullname = "Test Author", bio = null) {
  return prisma.authors.create({ data: { fullname, bio } });
}

async function createBook({ title, isbn, stock = 0, authorid, categoryid }) {
  return prisma.books.create({
    data: { title, isbn, stock, authorid, categoryid },
  });
}

describe("AUTHORS API - Integration Tests", () => {
  let adminToken;
  let userToken;

  beforeAll(() => {
    adminToken = signToken({ id: 1, role: "admin", type: "access" });
    userToken = signToken({ id: 2, role: "user", type: "access" });
  });

  describe("POST /api/v1/authors", () => {
    it("should create author as admin", async () => {
      const res = await request(app)
        .post("/api/v1/authors")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ fullname: "Test Author", bio: "Test Bio" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.fullname).toBe("Test Author");
    });

    it("should deny author creation for regular user", async () => {
      const res = await request(app)
        .post("/api/v1/authors")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ fullname: "Test Author" });

      expect(res.status).toBe(403);
    });

    it("should deny unauthenticated request", async () => {
      const res = await request(app)
        .post("/api/v1/authors")
        .send({ fullname: "Test Author" });

      expect(res.status).toBe(401);
    });

    it("should validate fullname length", async () => {
      const res = await request(app)
        .post("/api/v1/authors")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ fullname: "A" });

      expect(res.status).toBe(400);
    });

    it("should trim fullname", async () => {
      const res = await request(app)
        .post("/api/v1/authors")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ fullname: "  Trimmed Author  " });

      expect(res.status).toBe(201);
      expect(res.body.data.fullname).toBe("Trimmed Author");
    });
  });

  describe("GET /api/v1/authors", () => {
    it("should list authors without authentication", async () => {
      const res = await request(app).get("/api/v1/authors");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("pagination");
    });

    it("should paginate results", async () => {
      const res = await request(app).get("/api/v1/authors?page=1&limit=5");
      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
    });

    it("should reject invalid pagination params", async () => {
      const res = await request(app).get("/api/v1/authors?page=0");
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/authors/:id", () => {
    it("should get author by id", async () => {
      const author = await createAuthor("Get Test Author");
      const res = await request(app).get(`/api/v1/authors/${author.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(author.id);
    });

    it("should return 404 for non-existent author", async () => {
      const fakeId = "123e4567-e89b-12d3-a456-426614174000";
      const res = await request(app).get(`/api/v1/authors/${fakeId}`);
      expect(res.status).toBe(404);
    });

    it("should reject invalid UUID", async () => {
      const res = await request(app).get("/api/v1/authors/invalid-uuid");
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/v1/authors/:id", () => {
    it("should update author as admin", async () => {
      const author = await createAuthor("Update Test");
      const res = await request(app)
        .put(`/api/v1/authors/${author.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ fullname: "Updated Author Name" });

      expect(res.status).toBe(200);
      expect(res.body.data.fullname).toBe("Updated Author Name");
    });

    it("should deny update for regular user", async () => {
      const author = await createAuthor("No Hack");
      const res = await request(app)
        .put(`/api/v1/authors/${author.id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ fullname: "Hacked" });

      expect(res.status).toBe(403);
    });

    it("should update only bio", async () => {
      const author = await createAuthor("Bio Update");
      const res = await request(app)
        .put(`/api/v1/authors/${author.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ bio: "New biography" });

      expect(res.status).toBe(200);
      expect(res.body.data.bio).toBe("New biography");
    });

    it("should set bio to null", async () => {
      const author = await createAuthor("Bio Null", "some bio");
      const res = await request(app)
        .put(`/api/v1/authors/${author.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ bio: null });

      expect(res.status).toBe(200);
      expect(res.body.data.bio).toBeNull();
    });

    it("should reject empty update body", async () => {
      const author = await createAuthor("Empty Body");
      const res = await request(app)
        .put(`/api/v1/authors/${author.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/v1/authors/:id", () => {
    it("should soft delete author as admin", async () => {
      const author = await createAuthor("To Delete");
      const res = await request(app)
        .delete(`/api/v1/authors/${author.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("silindi");

      const deleted = await prisma.authors.findFirst({ where: { id: author.id } });
      expect(deleted.deletedat).not.toBeNull();
    });
  });

  describe("GET /api/v1/authors/:id/books", () => {
    it("should list author books", async () => {
      const author = await createAuthor("Author With Books");
      const category = await createCategory("Test Cat");

      await createBook({
        title: "Book 1",
        isbn: "1234567890123",
        stock: 5,
        authorid: author.id,
        categoryid: category.id,
      });

      await createBook({
        title: "Book 2",
        isbn: "1234567890124",
        stock: 3,
        authorid: author.id,
        categoryid: category.id,
      });

      const res = await request(app).get(`/api/v1/authors/${author.id}/books`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should paginate author books", async () => {
      const author = await createAuthor("Author Paging");
      const category = await createCategory("Paging Cat");

      await createBook({
        title: "Book A",
        isbn: "2234567890123",
        stock: 1,
        authorid: author.id,
        categoryid: category.id,
      });

      await createBook({
        title: "Book B",
        isbn: "2234567890124",
        stock: 1,
        authorid: author.id,
        categoryid: category.id,
      });

      const res = await request(app).get(
        `/api/v1/authors/${author.id}/books?page=1&limit=1`
      );

      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBe(1);
    });

    it("should return 404 for non-existent author", async () => {
      const fakeId = "123e4567-e89b-12d3-a456-426614174000";
      const res = await request(app).get(`/api/v1/authors/${fakeId}/books`);
      expect(res.status).toBe(404);
    });

    it("should search books by title", async () => {
      const author = await createAuthor("Author Search");
      const category = await createCategory("Search Cat");

      await createBook({
        title: "My Special Book",
        isbn: "3234567890123",
        stock: 1,
        authorid: author.id,
        categoryid: category.id,
      });

      const res = await request(app).get(
        `/api/v1/authors/${author.id}/books?search=Special`
      );

      expect(res.status).toBe(200);
    });
  });
});
