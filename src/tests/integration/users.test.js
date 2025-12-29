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

describe("USERS API - Integration Tests", () => {
  let adminToken;
  let userToken;
  let admin;
  let user;

  beforeAll(async () => {
    admin = await createUser({ email: "admin@test.com", role: "admin" });
    user = await createUser({ email: "user@test.com", role: "user" });

    adminToken = signToken({ id: admin.id, role: "admin", type: "access" });
    userToken = signToken({ id: user.id, role: "user", type: "access" });
  });

  describe("GET /api/v1/users/me", () => {
    it("should get own profile", async () => {
      const testUser = await createUser({ email: `me_${Date.now()}@test.com`, role: "user" });
      const testToken = signToken({ id: testUser.id, role: "user", type: "access" });
      
      const res = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testUser.id);
      expect(res.body.data).not.toHaveProperty("password");
    });

    it("should deny unauthenticated request", async () => {
      const res = await request(app).get("/api/v1/users/me");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/users", () => {
    it("should list users as admin", async () => {
      const res = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("pagination");
    });

    it("should deny list for regular user", async () => {
      const res = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it("should paginate results", async () => {
      const res = await request(app)
        .get("/api/v1/users?page=1&limit=5")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
    });

    it("should filter by search query", async () => {
      await createUser({ name: "Special User", email: "special@test.com" });
      const res = await request(app)
        .get("/api/v1/users?search=Special")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it("should filter by role", async () => {
      const res = await request(app)
        .get("/api/v1/users?role=admin")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/v1/users/:id", () => {
    it("should get user by id as admin", async () => {
      const testUser = await createUser({ email: "getuser@test.com" });
      const res = await request(app)
        .get(`/api/v1/users/${testUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testUser.id);
      expect(res.body.data).not.toHaveProperty("password");
    });

    it("should deny get for regular user", async () => {
      const testUser = await createUser({ email: "getuser2@test.com" });
      const res = await request(app)
        .get(`/api/v1/users/${testUser.id}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent user", async () => {
      const fakeId = "123e4567-e89b-12d3-a456-426614174000";
      const res = await request(app)
        .get(`/api/v1/users/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/v1/users/:id", () => {
    it("should update own profile", async () => {
      const testUser = await createUser({ email: `update_${Date.now()}@test.com`, role: "user" });
      const testToken = signToken({ id: testUser.id, role: "user", type: "access" });
      
      const res = await request(app)
        .put(`/api/v1/users/${testUser.id}`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: "Updated Name" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Updated Name");
    });

    it("should allow admin to update any user", async () => {
      const testUser = await createUser({ email: "updateuser@test.com" });
      const res = await request(app)
        .put(`/api/v1/users/${testUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Admin Updated" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Admin Updated");
    });

    it("should deny update for other user's profile", async () => {
      const otherUser = await createUser({ email: "other@test.com" });
      const res = await request(app)
        .put(`/api/v1/users/${otherUser.id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "Hacked" });

      expect(res.status).toBe(403);
    });

    it("should reject empty update body", async () => {
      const res = await request(app)
        .put(`/api/v1/users/${user.id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("should hash password when updating", async () => {
      const testUser = await createUser({ email: `password_${Date.now()}@test.com`, role: "user" });
      const testToken = signToken({ id: testUser.id, role: "user", type: "access" });
      
      const res = await request(app)
        .put(`/api/v1/users/${testUser.id}`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ password: "NewPassword123!" });

      expect(res.status).toBe(200);
      const updated = await prisma.users.findFirst({ where: { id: testUser.id } });
      expect(updated.password).not.toBe("NewPassword123!");
      expect(updated.password.startsWith("$2b$")).toBe(true);
    });

    it("should prevent user from updating admin", async () => {
      const testAdmin = await createUser({ email: `admin_${Date.now()}@test.com`, role: "admin" });
      const testUser = await createUser({ email: `hacker_${Date.now()}@test.com`, role: "user" });
      const testToken = signToken({ id: testUser.id, role: "user", type: "access" });
      
      const res = await request(app)
        .put(`/api/v1/users/${testAdmin.id}`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: "Hacked Admin" });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/v1/users/:id", () => {
    it("should soft delete user as admin", async () => {
      const testUser = await createUser({ email: "deleteuser@test.com" });
      const res = await request(app)
        .delete(`/api/v1/users/${testUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("silindi");

      const deleted = await prisma.users.findFirst({ where: { id: testUser.id } });
      expect(deleted.deletedat).not.toBeNull();
    });

    it("should deny delete for regular user", async () => {
      const testUser = await createUser({ email: "nodelete@test.com" });
      const res = await request(app)
        .delete(`/api/v1/users/${testUser.id}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/v1/users/:id/borrowings", () => {
    it("should get own borrowings", async () => {
      const res = await request(app)
        .get(`/api/v1/users/${user.id}/borrowings`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should allow admin to get any user's borrowings", async () => {
      const testUser = await createUser({ email: "borrowuser@test.com" });
      const res = await request(app)
        .get(`/api/v1/users/${testUser.id}/borrowings`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it("should deny getting other user's borrowings", async () => {
      const otherUser = await createUser({ email: "otherborrow@test.com" });
      const res = await request(app)
        .get(`/api/v1/users/${otherUser.id}/borrowings`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it("should filter by status", async () => {
      const res = await request(app)
        .get(`/api/v1/users/${user.id}/borrowings?status=active`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
    });
  });
});

