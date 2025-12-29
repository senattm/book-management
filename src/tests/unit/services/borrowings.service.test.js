jest.mock("../../../config/database", () => {
  const prisma = {
    books: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    borrowings: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(async (fn) => fn(prisma)),
  };
  return { prisma };
});

const { prisma } = require("../../../config/database");
const borrowingService = require("../../../services/borrowings.service");

function mkUser({ role = "user", id = "u-1" } = {}) {
  return { id, role };
}

describe("Borrowings Service - Unit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createBorrowing", () => {
    it("should throw 401 when actor missing", async () => {
      await expect(
        borrowingService.createBorrowing(null, { bookid: "b1" })
      ).rejects.toMatchObject({ statusCode: 401, code: "UNAUTHORIZED" });
    });

    it("should throw 404 when book not found", async () => {
      prisma.books.findFirst.mockResolvedValue(null);

      await expect(
        borrowingService.createBorrowing(mkUser(), {
          bookid: "123e4567-e89b-12d3-a456-426614174000",
        })
      ).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
    });

    it("should throw 400 when stock <= 0", async () => {
      prisma.books.findFirst.mockResolvedValue({
        id: "b1",
        stock: 0,
        deletedat: null,
      });

      await expect(
        borrowingService.createBorrowing(mkUser(), {
          bookid: "123e4567-e89b-12d3-a456-426614174000",
        })
      ).rejects.toMatchObject({ statusCode: 400, code: "VALIDATION_ERROR" });
    });

    it("should create borrowing for self (userid omitted) and decrement stock", async () => {
      prisma.books.findFirst.mockResolvedValue({
        id: "b1",
        stock: 3,
        deletedat: null,
      });

      prisma.borrowings.create.mockResolvedValue({
        id: "br-1",
        userid: "u-1",
        bookid: "b1",
      });

      prisma.books.update.mockResolvedValue({ id: "b1", stock: 2 });

      const actor = mkUser({ id: "u-1", role: "user" });

      const res = await borrowingService.createBorrowing(actor, {
        bookid: "b1",
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.borrowings.create).toHaveBeenCalled();
      expect(prisma.books.update).toHaveBeenCalled();
      expect(res).toHaveProperty("id", "br-1");
    });

    it("should forbid non-admin creating borrowing for another user", async () => {
      prisma.books.findFirst.mockResolvedValue({ id: "b1", stock: 3, deletedat: null });

      await expect(
        borrowingService.createBorrowing(mkUser({ id: "u-1", role: "user" }), {
          bookid: "b1",
          userid: "u-2",
        })
      ).rejects.toMatchObject({ statusCode: 403, code: "FORBIDDEN" });
    });

    it("should allow admin creating borrowing for another user", async () => {
      prisma.books.findFirst.mockResolvedValue({ id: "b1", stock: 3, deletedat: null });

      prisma.borrowings.create.mockResolvedValue({ id: "br-2", userid: "u-2", bookid: "b1" });
      prisma.books.update.mockResolvedValue({ id: "b1", stock: 2 });

      const res = await borrowingService.createBorrowing(mkUser({ id: "admin-1", role: "admin" }), {
        bookid: "b1",
        userid: "u-2",
      });

      expect(res.id).toBe("br-2");
    });
  });

  describe("returnBorrowing", () => {
    it("should throw 401 when actor missing", async () => {
      await expect(borrowingService.returnBorrowing(null, "br-1")).rejects.toMatchObject({
        statusCode: 401,
        code: "UNAUTHORIZED",
      });
    });

    it("should throw 404 when borrowing not found", async () => {
      prisma.borrowings.findFirst.mockResolvedValue(null);

      await expect(
        borrowingService.returnBorrowing(mkUser(), "br-404")
      ).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
    });

    it("should throw 400 when already returned", async () => {
      prisma.borrowings.findFirst.mockResolvedValue({
        id: "br-1",
        userid: "u-1",
        bookid: "b1",
        returnedat: new Date(),
        deletedat: null,
      });

      await expect(
        borrowingService.returnBorrowing(mkUser({ id: "u-1" }), "br-1")
      ).rejects.toMatchObject({ statusCode: 400, code: "VALIDATION_ERROR" });
    });

    it("should return borrowing and increment stock", async () => {
      prisma.borrowings.findFirst.mockResolvedValue({
        id: "br-1",
        userid: "u-1",
        bookid: "b1",
        returnedat: null,
        deletedat: null,
      });

      prisma.borrowings.update.mockResolvedValue({
        id: "br-1",
        userid: "u-1",
        bookid: "b1",
        returnedat: new Date(),
      });

      prisma.books.update.mockResolvedValue({ id: "b1" });

      const res = await borrowingService.returnBorrowing(mkUser({ id: "u-1" }), "br-1");

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.borrowings.update).toHaveBeenCalled();
      expect(prisma.books.update).toHaveBeenCalled();
      expect(res.id).toBe("br-1");
    });
  });

  describe("listOverdueBorrowings", () => {
    it("should forbid non-admin", async () => {
      await expect(
        borrowingService.listOverdueBorrowings(mkUser({ role: "user" }), {})
      ).rejects.toMatchObject({ statusCode: 403, code: "FORBIDDEN" });
    });

    it("should return overdue list for admin", async () => {
      prisma.borrowings.findMany.mockResolvedValue([{ id: "br-1" }]);
      prisma.borrowings.count.mockResolvedValue(1);

      const res = await borrowingService.listOverdueBorrowings(mkUser({ role: "admin" }), {
        page: 1,
        limit: 10,
      });

      expect(res.items.length).toBe(1);
      expect(res).toHaveProperty("pagination.totalItems", 1);
    });
  });

  describe("listBorrowingsByUser", () => {
    it("should forbid user listing other user's borrowings", async () => {
      await expect(
        borrowingService.listBorrowingsByUser(mkUser({ id: "u-1", role: "user" }), "u-2", {})
      ).rejects.toMatchObject({ statusCode: 403, code: "FORBIDDEN" });
    });

    it("should allow self listing", async () => {
      prisma.borrowings.findMany.mockResolvedValue([{ id: "br-1" }]);
      prisma.borrowings.count.mockResolvedValue(1);

      const res = await borrowingService.listBorrowingsByUser(mkUser({ id: "u-1", role: "user" }), "u-1", {
        page: 1,
        limit: 10,
        status: "active",
      });

      expect(res.items.length).toBe(1);
      expect(res).toHaveProperty("pagination.totalItems", 1);
    });

    it("should allow admin listing anyone", async () => {
      prisma.borrowings.findMany.mockResolvedValue([{ id: "br-1" }]);
      prisma.borrowings.count.mockResolvedValue(1);

      const res = await borrowingService.listBorrowingsByUser(mkUser({ id: "a-1", role: "admin" }), "u-9", {});

      expect(res.items.length).toBe(1);
    });
  });
});
