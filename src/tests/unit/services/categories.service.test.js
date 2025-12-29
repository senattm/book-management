jest.mock("../../../config/database", () => ({
  prisma: {
    categories: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    books: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const categoryService = require("../../../services/categories.service");
const { prisma } = require("../../../config/database");

describe("CategoryService - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createCategory", () => {
    it("should create category with trimmed data", async () => {
      const mockCategory = {
        id: "uuid-1",
        categoryname: "Test Category",
        parentid: null,
        createdat: new Date(),
        updatedat: new Date(),
        deletedat: null,
      };

      prisma.categories.findFirst.mockResolvedValue(null);
      prisma.categories.create.mockResolvedValue(mockCategory);

      const result = await categoryService.createCategory({
        categoryname: "  Test Category  ",
        parentid: null,
      });

      expect(result).toEqual(mockCategory);
      expect(prisma.categories.create).toHaveBeenCalledWith({
        data: {
          categoryname: "Test Category",
          parentid: null,
        },
      });
    });

    it("should create category with parentid", async () => {
      const parent = { id: "parent-uuid" };
      const mockCategory = {
        id: "uuid-1",
        categoryname: "Child Category",
        parentid: "parent-uuid",
      };

      prisma.categories.findFirst.mockResolvedValueOnce(parent);
      prisma.categories.create.mockResolvedValue(mockCategory);

      const result = await categoryService.createCategory({
        categoryname: "Child Category",
        parentid: "parent-uuid",
      });

      expect(result.parentid).toBe("parent-uuid");
    });

    it("should throw 404 if parent not found", async () => {
      prisma.categories.findFirst.mockResolvedValue(null);

      await expect(
        categoryService.createCategory({
          categoryname: "Child",
          parentid: "non-existent",
        })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Üst kategori bulunamadı.",
      });
    });
  });

  describe("listCategories", () => {
    it("should return paginated categories", async () => {
      const mockCategories = [
        { id: "1", categoryname: "Category 1" },
        { id: "2", categoryname: "Category 2" },
      ];

      prisma.categories.findMany.mockResolvedValue(mockCategories);
      prisma.categories.count.mockResolvedValue(25);

      const result = await categoryService.listCategories({
        page: 1,
        limit: 10,
      });

      expect(result.items).toEqual(mockCategories);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        totalItems: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: false,
      });
    });

    it("should use default pagination values", async () => {
      prisma.categories.findMany.mockResolvedValue([]);
      prisma.categories.count.mockResolvedValue(0);

      const result = await categoryService.listCategories({});

      expect(prisma.categories.findMany).toHaveBeenCalledWith({
        where: { deletedat: null },
        skip: 0,
        take: 10,
        include: {
          categories: true,
          other_categories: true,
        },
      });
    });

    it("should filter by search query", async () => {
      prisma.categories.findMany.mockResolvedValue([]);
      prisma.categories.count.mockResolvedValue(0);

      await categoryService.listCategories({
        search: "Test",
        page: 1,
        limit: 10,
      });

      expect(prisma.categories.findMany).toHaveBeenCalledWith({
        where: {
          deletedat: null,
          categoryname: { contains: "Test", mode: "insensitive" },
        },
        skip: 0,
        take: 10,
        include: {
          categories: true,
          other_categories: true,
        },
      });
    });

    it("should filter by parentid", async () => {
      prisma.categories.findMany.mockResolvedValue([]);
      prisma.categories.count.mockResolvedValue(0);

      await categoryService.listCategories({
        parentid: "parent-uuid",
        page: 1,
        limit: 10,
      });

      expect(prisma.categories.findMany).toHaveBeenCalledWith({
        where: {
          deletedat: null,
          parentid: "parent-uuid",
        },
        skip: 0,
        take: 10,
        include: {
          categories: true,
          other_categories: true,
        },
      });
    });

    it("should exclude soft deleted categories", async () => {
      prisma.categories.findMany.mockResolvedValue([]);
      prisma.categories.count.mockResolvedValue(0);

      await categoryService.listCategories({});

      const whereClause = prisma.categories.findMany.mock.calls[0][0].where;
      expect(whereClause.deletedat).toBeNull();
    });
  });

  describe("getCategoryById", () => {
    it("should return category by id", async () => {
      const mockCategory = {
        id: "uuid-1",
        categoryname: "Test Category",
        categories: [],
        other_categories: null,
      };

      prisma.categories.findFirst.mockResolvedValue(mockCategory);

      const result = await categoryService.getCategoryById("uuid-1");

      expect(result).toEqual(mockCategory);
      expect(prisma.categories.findFirst).toHaveBeenCalledWith({
        where: { id: "uuid-1", deletedat: null },
        include: {
          categories: true,
          other_categories: true,
        },
      });
    });

    it("should throw 404 if category not found", async () => {
      prisma.categories.findFirst.mockResolvedValue(null);

      await expect(
        categoryService.getCategoryById("non-existent-id")
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Kategori bulunamadı",
      });
    });
  });

  describe("updateCategory", () => {
    it("should update category", async () => {
      const existingCategory = { id: "uuid-1", categoryname: "Old Name" };
      const updatedCategory = { id: "uuid-1", categoryname: "New Name" };

      prisma.categories.findFirst.mockResolvedValue(existingCategory);
      prisma.categories.update.mockResolvedValue(updatedCategory);

      const result = await categoryService.updateCategory("uuid-1", {
        categoryname: "New Name",
      });

      expect(result).toEqual(updatedCategory);
      expect(prisma.categories.update).toHaveBeenCalledWith({
        where: { id: "uuid-1" },
        data: {
          categoryname: "New Name",
          updatedat: expect.any(Date),
        },
      });
    });

    it("should throw 404 if category not found", async () => {
      prisma.categories.findFirst.mockResolvedValue(null);

      await expect(
        categoryService.updateCategory("non-existent", { categoryname: "Test" })
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should prevent category from being its own parent", async () => {
      const category = { id: "uuid-1" };
      prisma.categories.findFirst.mockResolvedValue(category);

      await expect(
        categoryService.updateCategory("uuid-1", { parentid: "uuid-1" })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Kategori kendisini parent olarak alamaz.",
      });
    });

    it("should validate parent exists when updating parentid", async () => {
      const category = { id: "uuid-1" };
      prisma.categories.findFirst
        .mockResolvedValueOnce(category)
        .mockResolvedValueOnce(null);

      await expect(
        categoryService.updateCategory("uuid-1", { parentid: "invalid-parent" })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Üst kategori bulunamadı.",
      });
    });
  });

  describe("softDeleteCategory", () => {
    it("should soft delete category", async () => {
      prisma.categories.findFirst.mockResolvedValue({ id: "uuid-1" });
      prisma.categories.update.mockResolvedValue({
        id: "uuid-1",
        deletedat: new Date(),
      });

      await categoryService.softDeleteCategory("uuid-1");

      expect(prisma.categories.update).toHaveBeenCalledWith({
        where: { id: "uuid-1" },
        data: {
          deletedat: expect.any(Date),
          updatedat: expect.any(Date),
        },
      });
    });

    it("should throw 404 if category not found", async () => {
      prisma.categories.findFirst.mockResolvedValue(null);

      await expect(
        categoryService.softDeleteCategory("non-existent")
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("getCategoryBooks", () => {
    it("should return category books with pagination", async () => {
      const mockBooks = [
        { id: "book-1", title: "Book 1", categoryid: "uuid-1" },
        { id: "book-2", title: "Book 2", categoryid: "uuid-1" },
      ];

      prisma.categories.findFirst.mockResolvedValue({ id: "uuid-1" });
      prisma.books.findMany.mockResolvedValue(mockBooks);
      prisma.books.count.mockResolvedValue(15);

      const result = await categoryService.getCategoryBooks("uuid-1", {
        page: 1,
        limit: 10,
      });

      expect(result.items).toEqual(mockBooks);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        totalItems: 15,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false,
      });
    });

    it("should throw 404 if category not found", async () => {
      prisma.categories.findFirst.mockResolvedValue(null);

      await expect(
        categoryService.getCategoryBooks("non-existent", {})
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should filter books by search query", async () => {
      prisma.categories.findFirst.mockResolvedValue({ id: "uuid-1" });
      prisma.books.findMany.mockResolvedValue([]);
      prisma.books.count.mockResolvedValue(0);

      await categoryService.getCategoryBooks("uuid-1", {
        search: "1984",
      });

      expect(prisma.books.findMany).toHaveBeenCalledWith({
        where: {
          deletedat: null,
          categoryid: "uuid-1",
          OR: [
            { title: { contains: "1984", mode: "insensitive" } },
            { isbn: { contains: "1984", mode: "insensitive" } },
          ],
        },
        skip: 0,
        take: 10,
        include: { authors: true, categories: true },
      });
    });

    it("should exclude soft deleted books", async () => {
      prisma.categories.findFirst.mockResolvedValue({ id: "uuid-1" });
      prisma.books.findMany.mockResolvedValue([]);
      prisma.books.count.mockResolvedValue(0);

      await categoryService.getCategoryBooks("uuid-1", {});

      const whereClause = prisma.books.findMany.mock.calls[0][0].where;
      expect(whereClause.deletedat).toBeNull();
    });
  });
});

