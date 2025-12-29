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

async function createCategory(categoryname = "Test Category", parentid = null) {
  return prisma.categories.create({ data: { categoryname, parentid } });
}

describe("CATEGORIES API - Integration Tests", () => {
  let adminToken;
  let userToken;

  beforeAll(() => {
    adminToken = signToken({ id: 1, role: "admin", type: "access" });
    userToken = signToken({ id: 2, role: "user", type: "access" });
  });

  describe("GET /api/v1/categories", () => {
    it("should list categories without authentication", async () => {
      const res = await request(app).get("/api/v1/categories");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("pagination");
    });

    it("should paginate results", async () => {
      const res = await request(app).get("/api/v1/categories?page=1&limit=5");
      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
    });

    it("should filter by search query", async () => {
      await createCategory("Special Category");
      const res = await request(app).get("/api/v1/categories?search=Special");
      expect(res.status).toBe(200);
    });

    it("should filter by parentid", async () => {
      const parent = await createCategory("Parent Category");
      await createCategory("Child Category", parent.id);
      const res = await request(app).get(`/api/v1/categories?parentid=${parent.id}`);
      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/v1/categories/:id", () => {
    it("should get category by id", async () => {
      const category = await createCategory("Get Test Category");
      const res = await request(app).get(`/api/v1/categories/${category.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(category.id);
    });

    it("should return 404 for non-existent category", async () => {
      const fakeId = "123e4567-e89b-12d3-a456-426614174000";
      const res = await request(app).get(`/api/v1/categories/${fakeId}`);
      expect(res.status).toBe(404);
    });

    it("should reject invalid UUID", async () => {
      const res = await request(app).get("/api/v1/categories/invalid-uuid");
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/categories", () => {
    it("should create category as admin", async () => {
      const res = await request(app)
        .post("/api/v1/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ categoryname: "Test Category", parentid: null });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.categoryname).toBe("Test Category");
    });

    it("should deny category creation for regular user", async () => {
      const res = await request(app)
        .post("/api/v1/categories")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ categoryname: "Test Category" });

      expect(res.status).toBe(403);
    });

    it("should deny unauthenticated request", async () => {
      const res = await request(app)
        .post("/api/v1/categories")
        .send({ categoryname: "Test Category" });

      expect(res.status).toBe(401);
    });

    it("should validate categoryname length", async () => {
      const res = await request(app)
        .post("/api/v1/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ categoryname: "A" });

      expect(res.status).toBe(400);
    });

    it("should trim categoryname", async () => {
      const res = await request(app)
        .post("/api/v1/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ categoryname: "  Trimmed Category  " });

      expect(res.status).toBe(201);
      expect(res.body.data.categoryname).toBe("Trimmed Category");
    });

    it("should create category with parentid", async () => {
      const parent = await createCategory("Parent");
      const res = await request(app)
        .post("/api/v1/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ categoryname: "Child", parentid: parent.id });

      expect(res.status).toBe(201);
      expect(res.body.data.parentid).toBe(parent.id);
    });

    it("should return 404 for invalid parentid", async () => {
      const fakeId = "123e4567-e89b-12d3-a456-426614174000";
      const res = await request(app)
        .post("/api/v1/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ categoryname: "Child", parentid: fakeId });

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/v1/categories/:id", () => {
    it("should update category as admin", async () => {
      const category = await createCategory("Update Test");
      const res = await request(app)
        .put(`/api/v1/categories/${category.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ categoryname: "Updated Category Name" });

      expect(res.status).toBe(200);
      expect(res.body.data.categoryname).toBe("Updated Category Name");
    });

    it("should deny update for regular user", async () => {
      const category = await createCategory("No Hack");
      const res = await request(app)
        .put(`/api/v1/categories/${category.id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ categoryname: "Hacked" });

      expect(res.status).toBe(403);
    });

    it("should reject empty update body", async () => {
      const category = await createCategory("Empty Body");
      const res = await request(app)
        .put(`/api/v1/categories/${category.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("should prevent category from being its own parent", async () => {
      const category = await createCategory("Self Parent");
      const res = await request(app)
        .put(`/api/v1/categories/${category.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ parentid: category.id });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/v1/categories/:id", () => {
    it("should soft delete category as admin", async () => {
      const category = await createCategory("To Delete");
      const res = await request(app)
        .delete(`/api/v1/categories/${category.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("silindi");

      const deleted = await prisma.categories.findFirst({ where: { id: category.id } });
      expect(deleted.deletedat).not.toBeNull();
    });

    it("should deny delete for regular user", async () => {
      const category = await createCategory("No Delete");
      const res = await request(app)
        .delete(`/api/v1/categories/${category.id}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/v1/categories/:id/books", () => {
    it("should list category books", async () => {
      const category = await createCategory("Category With Books");
      const author = await prisma.authors.create({ data: { fullname: "Test Author" } });

      await prisma.books.create({
        data: {
          title: "Book 1",
          isbn: "1234567890123",
          stock: 5,
          authorid: author.id,
          categoryid: category.id,
        },
      });

      const res = await request(app).get(`/api/v1/categories/${category.id}/books`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("pagination");
    });

    it("should paginate category books", async () => {
      const category = await createCategory("Paging Category");
      const author = await prisma.authors.create({ data: { fullname: "Test Author" } });

      await prisma.books.create({
        data: {
          title: "Book A",
          isbn: "2234567890123",
          stock: 1,
          authorid: author.id,
          categoryid: category.id,
        },
      });

      const res = await request(app).get(
        `/api/v1/categories/${category.id}/books?page=1&limit=1`
      );

      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBe(1);
    });

    it("should return 404 for non-existent category", async () => {
      const fakeId = "123e4567-e89b-12d3-a456-426614174000";
      const res = await request(app).get(`/api/v1/categories/${fakeId}/books`);
      expect(res.status).toBe(404);
    });

    it("should search books by title", async () => {
      const category = await createCategory("Search Category");
      const author = await prisma.authors.create({ data: { fullname: "Test Author" } });

      await prisma.books.create({
        data: {
          title: "My Special Book",
          isbn: "3234567890123",
          stock: 1,
          authorid: author.id,
          categoryid: category.id,
        },
      });

      const res = await request(app).get(
        `/api/v1/categories/${category.id}/books?search=Special`
      );

      expect(res.status).toBe(200);
    });
  });
});

