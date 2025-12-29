jest.mock("../../../config/database", () => ({
  prisma: {
    users: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const bcrypt = require("bcrypt");
const userService = require("../../../services/users.service");
const { prisma } = require("../../../config/database");

describe("UserService - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listUsers", () => {
    it("should return paginated users", async () => {
      const mockUsers = [
        { id: "1", name: "User 1", email: "user1@test.com", password: "hashed" },
        { id: "2", name: "User 2", email: "user2@test.com", password: "hashed" },
      ];

      prisma.users.findMany.mockResolvedValue(mockUsers);
      prisma.users.count.mockResolvedValue(25);

      const result = await userService.listUsers({
        page: 1,
        limit: 10,
      });

      expect(result.items.length).toBe(2);
      expect(result.items[0]).not.toHaveProperty("password");
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        totalItems: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: false,
      });
    });

    it("should filter by search query", async () => {
      prisma.users.findMany.mockResolvedValue([]);
      prisma.users.count.mockResolvedValue(0);

      await userService.listUsers({
        search: "Test",
        page: 1,
        limit: 10,
      });

      expect(prisma.users.findMany).toHaveBeenCalledWith({
        where: {
          deletedat: null,
          OR: [
            { name: { contains: "Test", mode: "insensitive" } },
            { email: { contains: "Test", mode: "insensitive" } },
          ],
        },
        skip: 0,
        take: 10,
      });
    });

    it("should filter by role", async () => {
      prisma.users.findMany.mockResolvedValue([]);
      prisma.users.count.mockResolvedValue(0);

      await userService.listUsers({
        role: "admin",
        page: 1,
        limit: 10,
      });

      expect(prisma.users.findMany).toHaveBeenCalledWith({
        where: {
          deletedat: null,
          role: "admin",
        },
        skip: 0,
        take: 10,
      });
    });

    it("should exclude soft deleted users", async () => {
      prisma.users.findMany.mockResolvedValue([]);
      prisma.users.count.mockResolvedValue(0);

      await userService.listUsers({});

      const whereClause = prisma.users.findMany.mock.calls[0][0].where;
      expect(whereClause.deletedat).toBeNull();
    });
  });

  describe("getUserById", () => {
    it("should return user by id without password", async () => {
      const mockUser = {
        id: "uuid-1",
        name: "Test User",
        email: "test@example.com",
        password: "hashedpass",
        role: "user",
      };

      prisma.users.findFirst.mockResolvedValue(mockUser);

      const result = await userService.getUserById("uuid-1");

      expect(result).not.toHaveProperty("password");
      expect(result.id).toBe("uuid-1");
      expect(result.email).toBe("test@example.com");
    });

    it("should throw 404 if user not found", async () => {
      prisma.users.findFirst.mockResolvedValue(null);

      await expect(
        userService.getUserById("non-existent-id")
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Kullanıcı bulunamadı.",
      });
    });
  });

  describe("updateUser", () => {
    it("should update own profile", async () => {
      const actor = { id: "user-uuid", role: "user" };
      const targetUser = {
        id: "user-uuid",
        name: "Old Name",
        email: "old@test.com",
        role: "user",
      };
      const updatedUser = {
        id: "user-uuid",
        name: "New Name",
        email: "old@test.com",
        role: "user",
        password: "hashed",
      };

      prisma.users.findFirst.mockResolvedValue(targetUser);
      prisma.users.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUser(actor, "user-uuid", {
        name: "New Name",
      });

      expect(result.name).toBe("New Name");
      expect(result).not.toHaveProperty("password");
    });

    it("should allow admin to update any user", async () => {
      const actor = { id: "admin-uuid", role: "admin" };
      const targetUser = {
        id: "user-uuid",
        name: "User",
        role: "user",
      };
      const updatedUser = {
        id: "user-uuid",
        name: "Admin Updated",
        role: "user",
      };

      prisma.users.findFirst.mockResolvedValue(targetUser);
      prisma.users.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUser(actor, "user-uuid", {
        name: "Admin Updated",
      });

      expect(result.name).toBe("Admin Updated");
    });

    it("should throw 403 if user tries to update other user", async () => {
      const actor = { id: "user-uuid", role: "user" };
      const targetUser = {
        id: "other-uuid",
        name: "Other",
        role: "user",
      };

      prisma.users.findFirst.mockResolvedValue(targetUser);

      await expect(
        userService.updateUser(actor, "other-uuid", { name: "Hacked" })
      ).rejects.toMatchObject({
        statusCode: 403,
        message: "Sadece kendi profilinizi güncelleyebilirsiniz.",
      });
    });

    it("should throw 403 if user tries to update admin", async () => {
      const actor = { id: "user-uuid", role: "user" };
      const targetUser = {
        id: "admin-uuid",
        name: "Admin",
        email: "admin@test.com",
        role: "admin",
      };

      prisma.users.findFirst.mockResolvedValue(targetUser);

      try {
        await userService.updateUser(actor, "admin-uuid", { name: "Hacked" });
        fail("Should have thrown an error");
      } catch (err) {
        expect(err.statusCode).toBe(403);
        expect(err.message).toContain("admin");
      }
    });

    it("should hash password when updating", async () => {
      jest.clearAllMocks();
      
      const actor = { id: "user-uuid", role: "user" };
      const targetUser = {
        id: "user-uuid",
        name: "User",
        email: "user@test.com",
        role: "user", 
      };
      const updatedUser = {
        id: "user-uuid",
        password: "hashed",
      };

      prisma.users.findFirst.mockResolvedValue(targetUser);
      prisma.users.update.mockResolvedValue(updatedUser);

      await userService.updateUser(actor, "user-uuid", {
        password: "NewPassword123!",
      });

      const updateCall = prisma.users.update.mock.calls[0][0];
      expect(updateCall.data.password).not.toBe("NewPassword123!");
      expect(updateCall.data.password.startsWith("$2b$")).toBe(true);
    });

    it("should throw 400 if no fields to update", async () => {
      const actor = { id: "user-uuid", role: "user" };
      const targetUser = {
        id: "user-uuid",
        name: "User",
        role: "user",
      };

      prisma.users.findFirst.mockResolvedValue(targetUser);

      await expect(
        userService.updateUser(actor, "user-uuid", {})
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Güncelleme için en az bir alan gönderilmelidir.",
      });
    });

    it("should throw 404 if user not found", async () => {
      const actor = { id: "user-uuid", role: "user" };
      prisma.users.findFirst.mockResolvedValue(null);

      await expect(
        userService.updateUser(actor, "non-existent", { name: "Test" })
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("softDeleteUser", () => {
    it("should soft delete user", async () => {
      prisma.users.findFirst.mockResolvedValue({ id: "uuid-1" });
      prisma.users.update.mockResolvedValue({
        id: "uuid-1",
        deletedat: new Date(),
      });

      await userService.softDeleteUser("uuid-1");

      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: "uuid-1" },
        data: {
          deletedat: expect.any(Date),
          updatedat: expect.any(Date),
        },
      });
    });

    it("should throw 404 if user not found", async () => {
      prisma.users.findFirst.mockResolvedValue(null);

      await expect(
        userService.softDeleteUser("non-existent")
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("getMe", () => {
    it("should return own user data", async () => {
      const actor = { id: "user-uuid", role: "user" };
      const mockUser = {
        id: "user-uuid",
        name: "Test User",
        email: "test@example.com",
        password: "hashed",
        role: "user",
      };

      prisma.users.findFirst.mockResolvedValue(mockUser);

      const result = await userService.getMe(actor);

      expect(result.id).toBe("user-uuid");
      expect(result).not.toHaveProperty("password");
      expect(prisma.users.findFirst).toHaveBeenCalledWith({
        where: { id: "user-uuid", deletedat: null },
      });
    });
  });

  describe("sanitizeUser", () => {
    it("should remove password from user object", () => {
      const user = {
        id: 1,
        name: "Test",
        email: "test@example.com",
        password: "hashedpass",
        role: "user",
      };

      const sanitized = userService.sanitizeUser(user);

      expect(sanitized).not.toHaveProperty("password");
      expect(sanitized).toHaveProperty("id");
      expect(sanitized).toHaveProperty("email");
    });

    it("should handle null user", () => {
      const result = userService.sanitizeUser(null);
      expect(result).toBeNull();
    });
  });
});

