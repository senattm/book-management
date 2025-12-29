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

async function createAuthor(fullname = "Test Author") {
  return prisma.authors.create({ data: { fullname } });
}

async function createCategory(categoryname = "Test Category") {
  return prisma.categories.create({ data: { categoryname } });
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

describe("REVIEWS API - Integration Tests", () => {
  let userToken;
  let adminToken;
  let user;
  let admin;
  let book;

  beforeAll(async () => {
    user = await createUser({ email: "user@test.com", role: "user" });
    admin = await createUser({ email: "admin@test.com", role: "admin" });
    book = await createBook({ title: "Review Test Book" });

    userToken = signToken({ id: user.id, role: "user", type: "access" });
    adminToken = signToken({ id: admin.id, role: "admin", type: "access" });
  });

  describe("GET /api/v1/books/:id/reviews", () => {
    it("should list reviews for a book", async () => {
      const testBook = await createBook({ title: "Book With Reviews" });
      const testUser = await createUser();

      await prisma.reviews.create({
        data: {
          bookid: testBook.id,
          userid: testUser.id,
          rating: 5,
          comment: "Great book!",
        },
      });

      const res = await request(app).get(`/api/v1/books/${testBook.id}/reviews`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should return 404 for non-existent book", async () => {
      const fakeId = "123e4567-e89b-12d3-a456-426614174000";
      const res = await request(app).get(`/api/v1/books/${fakeId}/reviews`);
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/v1/books/:id/reviews", () => {
    it("should create review as authenticated user", async () => {
      const testUser = await createUser({ email: `review_${Date.now()}@test.com`, role: "user" });
      const testToken = signToken({ id: testUser.id, role: "user", type: "access" });
      const testBook = await createBook({ title: "New Review Book" });
      
      const res = await request(app)
        .post(`/api/v1/books/${testBook.id}/reviews`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ rating: 5, comment: "Excellent book!" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.rating).toBe(5);
    });

    it("should deny unauthenticated request", async () => {
      const testBook = await createBook();
      const res = await request(app)
        .post(`/api/v1/books/${testBook.id}/reviews`)
        .send({ rating: 5, comment: "Test" });

      expect(res.status).toBe(401);
    });

    it("should validate rating range", async () => {
      const testBook = await createBook();
      const res = await request(app)
        .post(`/api/v1/books/${testBook.id}/reviews`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ rating: 6 });

      expect(res.status).toBe(400);
    });

    it("should prevent duplicate reviews for same book", async () => {
      const testUser = await createUser({ email: `duplicate_${Date.now()}@test.com`, role: "user" });
      const testToken = signToken({ id: testUser.id, role: "user", type: "access" });
      const testBook = await createBook({ title: "Duplicate Review Book" });
      
      await request(app)
        .post(`/api/v1/books/${testBook.id}/reviews`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ rating: 5, comment: "First review" });

      const res = await request(app)
        .post(`/api/v1/books/${testBook.id}/reviews`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ rating: 4, comment: "Second review" });

      expect(res.status).toBe(409);
    });

    it("should accept review without comment", async () => {
      const testUser = await createUser({ email: `nocomment_${Date.now()}@test.com`, role: "user" });
      const testToken = signToken({ id: testUser.id, role: "user", type: "access" });
      const testBook = await createBook({ title: "No Comment Book" });
      
      const res = await request(app)
        .post(`/api/v1/books/${testBook.id}/reviews`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ rating: 4 });

      expect(res.status).toBe(201);
      expect(res.body.data.rating).toBe(4);
    });
  });

  describe("PUT /api/v1/reviews/:id", () => {
    it("should update own review", async () => {
      const testUser = await createUser({ email: `updateuser_${Date.now()}@test.com`, role: "user" });
      const testBook = await createBook({ title: "Update Review Book" });
      
      const createRes = await request(app)
        .post(`/api/v1/books/${testBook.id}/reviews`)
        .set("Authorization", `Bearer ${signToken({ id: testUser.id, role: "user", type: "access" })}`)
        .send({ rating: 3, comment: "Old comment" });
      
      expect(createRes.status).toBe(201);
      const review = createRes.body.data;

      const res = await request(app)
        .put(`/api/v1/reviews/${review.id}`)
        .set("Authorization", `Bearer ${signToken({ id: testUser.id, role: "user", type: "access" })}`)
        .send({ rating: 5, comment: "Updated comment" });

      expect(res.status).toBe(200);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.comment).toBe("Updated comment");
    });

    it("should allow admin to update any review", async () => {
      const testUser = await createUser({ email: `adminupdate_${Date.now()}@test.com`, role: "user" });
      const testBook = await createBook({ title: "Admin Update Book" });
      
      const createRes = await request(app)
        .post(`/api/v1/books/${testBook.id}/reviews`)
        .set("Authorization", `Bearer ${signToken({ id: testUser.id, role: "user", type: "access" })}`)
        .send({ rating: 3, comment: "User review" });
      
      expect(createRes.status).toBe(201);
      const review = createRes.body.data;

      const res = await request(app)
        .put(`/api/v1/reviews/${review.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ rating: 4 });

      expect(res.status).toBe(200);
    });

    it("should deny update for other user's review", async () => {
      const ownerUser = await createUser({ email: `owner_${Date.now()}@test.com`, role: "user" });
      const otherUser = await createUser({ email: `other_${Date.now()}@test.com` });
      const otherUserToken = signToken({ id: otherUser.id, role: "user", type: "access" });
      const testBook = await createBook({ title: "Other User Book" });
      
      const createRes = await request(app)
        .post(`/api/v1/books/${testBook.id}/reviews`)
        .set("Authorization", `Bearer ${signToken({ id: ownerUser.id, role: "user", type: "access" })}`)
        .send({ rating: 3, comment: "User review" });
      
      expect(createRes.status).toBe(201);
      const review = createRes.body.data;

      const res = await request(app)
        .put(`/api/v1/reviews/${review.id}`)
        .set("Authorization", `Bearer ${otherUserToken}`)
        .send({ rating: 1 });

      expect(res.status).toBe(403);
    });

    it("should reject empty update body", async () => {
      const testUser = await createUser({ email: `emptyupdate_${Date.now()}@test.com`, role: "user" });
      const testBook = await createBook({ title: "Empty Update Book" });
      
      const createRes = await request(app)
        .post(`/api/v1/books/${testBook.id}/reviews`)
        .set("Authorization", `Bearer ${signToken({ id: testUser.id, role: "user", type: "access" })}`)
        .send({ rating: 3, comment: "Test" });
      
      expect(createRes.status).toBe(201);
      const review = createRes.body.data;

      const res = await request(app)
        .put(`/api/v1/reviews/${review.id}`)
        .set("Authorization", `Bearer ${signToken({ id: testUser.id, role: "user", type: "access" })}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("should allow setting comment to null", async () => {
      const testUser = await createUser({ email: `nullcomment_${Date.now()}@test.com`, role: "user" });
      const testBook = await createBook({ title: "Null Comment Book" });
      
      const createRes = await request(app)
        .post(`/api/v1/books/${testBook.id}/reviews`)
        .set("Authorization", `Bearer ${signToken({ id: testUser.id, role: "user", type: "access" })}`)
        .send({ rating: 3, comment: "Will be null" });
      
      expect(createRes.status).toBe(201);
      const review = createRes.body.data;

      const res = await request(app)
        .put(`/api/v1/reviews/${review.id}`)
        .set("Authorization", `Bearer ${signToken({ id: testUser.id, role: "user", type: "access" })}`)
        .send({ comment: null });

      expect(res.status).toBe(200);
      expect(res.body.data.comment).toBeNull();
    });
  });

  describe("DELETE /api/v1/reviews/:id", () => {
    it("should delete own review", async () => {
      const testUser = await createUser({ email: `delete_${Date.now()}@test.com`, role: "user" });
      const testBook = await createBook({ title: "Delete Review Book" });
      
      const createRes = await request(app)
        .post(`/api/v1/books/${testBook.id}/reviews`)
        .set("Authorization", `Bearer ${signToken({ id: testUser.id, role: "user", type: "access" })}`)
        .send({ rating: 3, comment: "To be deleted" });
      
      expect(createRes.status).toBe(201);
      const review = createRes.body.data;

      const res = await request(app)
        .delete(`/api/v1/reviews/${review.id}`)
        .set("Authorization", `Bearer ${signToken({ id: testUser.id, role: "user", type: "access" })}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("silindi");

      const deleted = await prisma.reviews.findFirst({ where: { id: review.id } });
      expect(deleted.deletedat).not.toBeNull();
    });

    it("should allow admin to delete any review", async () => {
      const testUser = await createUser({ email: `admindelete_${Date.now()}@test.com`, role: "user" });
      const testBook = await createBook({ title: "Admin Delete Book" });
      
      const createRes = await request(app)
        .post(`/api/v1/books/${testBook.id}/reviews`)
        .set("Authorization", `Bearer ${signToken({ id: testUser.id, role: "user", type: "access" })}`)
        .send({ rating: 3, comment: "Admin will delete" });
      
      expect(createRes.status).toBe(201);
      const review = createRes.body.data;

      const res = await request(app)
        .delete(`/api/v1/reviews/${review.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it("should deny delete for other user's review", async () => {
      const ownerUser = await createUser({ email: `owner2_${Date.now()}@test.com`, role: "user" });
      const otherUser = await createUser({ email: `other2_${Date.now()}@test.com` });
      const otherUserToken = signToken({ id: otherUser.id, role: "user", type: "access" });
      const testBook = await createBook({ title: "Other Delete Book" });
      
      const createRes = await request(app)
        .post(`/api/v1/books/${testBook.id}/reviews`)
        .set("Authorization", `Bearer ${signToken({ id: ownerUser.id, role: "user", type: "access" })}`)
        .send({ rating: 3, comment: "Not mine" });
      
      expect(createRes.status).toBe(201);
      const review = createRes.body.data;

      const res = await request(app)
        .delete(`/api/v1/reviews/${review.id}`)
        .set("Authorization", `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent review", async () => {
      const fakeId = "123e4567-e89b-12d3-a456-426614174000";
      const res = await request(app)
        .delete(`/api/v1/reviews/${fakeId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });
  });
});

