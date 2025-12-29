jest.mock("../../../config/database", () => ({
  prisma: {
    authors: {
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

const authorService = require("../../../services/authors.service");
const { prisma } = require("../../../config/database");

describe("AuthorService - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createAuthor", () => {
    it("should create author with trimmed data", async () => {
      const mockAuthor = {
        id: "uuid-1",
        fullname: "George Orwell",
        bio: "English novelist",
        createdat: new Date(),
        updatedat: new Date(),
        deletedat: null,
      };

      prisma.authors.create.mockResolvedValue(mockAuthor);

      const result = await authorService.createAuthor({
        fullname: "  George Orwell  ",
        bio: "  English novelist  ",
      });

      expect(result).toEqual(mockAuthor);
      expect(prisma.authors.create).toHaveBeenCalledWith({
        data: {
          fullname: "George Orwell",
          bio: "English novelist",
        },
      });
    });

    it("should create author without bio", async () => {
      const mockAuthor = {
        id: "uuid-1",
        fullname: "Unknown Author",
        bio: null,
      };

      prisma.authors.create.mockResolvedValue(mockAuthor);

      const result = await authorService.createAuthor({
        fullname: "Unknown Author",
      });

      expect(result.bio).toBeNull();
    });

    it("should handle bio as null explicitly", async () => {
      prisma.authors.create.mockResolvedValue({
        id: "uuid-1",
        fullname: "Test",
        bio: null,
      });

      await authorService.createAuthor({
        fullname: "Test",
        bio: null,
      });

      expect(prisma.authors.create).toHaveBeenCalledWith({
        data: {
          fullname: "Test",
          bio: null,
        },
      });
    });
  });

  describe("listAuthors", () => {
    it("should return paginated authors", async () => {
      const mockAuthors = [
        { id: "1", fullname: "Author 1" },
        { id: "2", fullname: "Author 2" },
      ];

      prisma.authors.findMany.mockResolvedValue(mockAuthors);
      prisma.authors.count.mockResolvedValue(25);

      const result = await authorService.listAuthors({
        page: 1,
        limit: 10,
      });

      expect(result.items).toEqual(mockAuthors);
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
      prisma.authors.findMany.mockResolvedValue([]);
      prisma.authors.count.mockResolvedValue(0);

      const result = await authorService.listAuthors({});

      expect(prisma.authors.findMany).toHaveBeenCalledWith({
        where: { deletedat: null },
        skip: 0,
        take: 10,
      });
    });

    it("should filter by search query", async () => {
      prisma.authors.findMany.mockResolvedValue([]);
      prisma.authors.count.mockResolvedValue(0);

      await authorService.listAuthors({
        search: "Orwell",
        page: 1,
        limit: 10,
      });

      expect(prisma.authors.findMany).toHaveBeenCalledWith({
        where: {
          deletedat: null,
          fullname: { contains: "Orwell", mode: "insensitive" },
        },
        skip: 0,
        take: 10,
      });
    });

    it("should calculate correct pagination for last page", async () => {
      prisma.authors.findMany.mockResolvedValue([{ id: "1" }]);
      prisma.authors.count.mockResolvedValue(21);

      const result = await authorService.listAuthors({
        page: 3,
        limit: 10,
      });

      expect(result.pagination).toEqual({
        page: 3,
        limit: 10,
        totalItems: 21,
        totalPages: 3,
        hasNextPage: false,
        hasPrevPage: true,
      });
    });

    it("should exclude soft deleted authors", async () => {
      prisma.authors.findMany.mockResolvedValue([]);
      prisma.authors.count.mockResolvedValue(0);

      await authorService.listAuthors({});

      const whereClause = prisma.authors.findMany.mock.calls[0][0].where;
      expect(whereClause.deletedat).toBeNull();
    });
  });

  describe("getAuthorById", () => {
    it("should return author by id", async () => {
      const mockAuthor = {
        id: "uuid-1",
        fullname: "George Orwell",
        bio: "English novelist",
      };

      prisma.authors.findFirst.mockResolvedValue(mockAuthor);

      const result = await authorService.getAuthorById("uuid-1");

      expect(result).toEqual(mockAuthor);
      expect(prisma.authors.findFirst).toHaveBeenCalledWith({
        where: { id: "uuid-1", deletedat: null },
      });
    });

    it("should throw 404 if author not found", async () => {
      prisma.authors.findFirst.mockResolvedValue(null);

      await expect(
        authorService.getAuthorById("non-existent-id")
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Yazar bulunamadı.",
        code: "NOT_FOUND",
      });
    });

    it("should not return soft deleted author", async () => {
      prisma.authors.findFirst.mockResolvedValue(null);

      await expect(
        authorService.getAuthorById("deleted-id")
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("updateAuthor", () => {
    it("should update author with trimmed data", async () => {
      const existingAuthor = { id: "uuid-1", fullname: "Old Name" };
      const updatedAuthor = { id: "uuid-1", fullname: "New Name" };

      prisma.authors.findFirst.mockResolvedValue(existingAuthor);
      prisma.authors.update.mockResolvedValue(updatedAuthor);

      const result = await authorService.updateAuthor("uuid-1", {
        fullname: "  New Name  ",
      });

      expect(result).toEqual(updatedAuthor);
      expect(prisma.authors.update).toHaveBeenCalledWith({
        where: { id: "uuid-1" },
        data: {
          fullname: "New Name",
          updatedat: expect.any(Date),
        },
      });
    });

    it("should update only bio", async () => {
      prisma.authors.findFirst.mockResolvedValue({ id: "uuid-1" });
      prisma.authors.update.mockResolvedValue({ id: "uuid-1" });

      await authorService.updateAuthor("uuid-1", {
        bio: "  New bio  ",
      });

      expect(prisma.authors.update).toHaveBeenCalledWith({
        where: { id: "uuid-1" },
        data: {
          bio: "New bio",
          updatedat: expect.any(Date),
        },
      });
    });

    it("should set bio to null", async () => {
      prisma.authors.findFirst.mockResolvedValue({ id: "uuid-1" });
      prisma.authors.update.mockResolvedValue({ id: "uuid-1" });

      await authorService.updateAuthor("uuid-1", {
        bio: null,
      });

      expect(prisma.authors.update).toHaveBeenCalledWith({
        where: { id: "uuid-1" },
        data: {
          bio: null,
          updatedat: expect.any(Date),
        },
      });
    });

    it("should throw 404 if author not found", async () => {
      prisma.authors.findFirst.mockResolvedValue(null);

      await expect(
        authorService.updateAuthor("non-existent", { fullname: "Test" })
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should update both fullname and bio", async () => {
      prisma.authors.findFirst.mockResolvedValue({ id: "uuid-1" });
      prisma.authors.update.mockResolvedValue({ id: "uuid-1" });

      await authorService.updateAuthor("uuid-1", {
        fullname: "New Name",
        bio: "New Bio",
      });

      expect(prisma.authors.update).toHaveBeenCalledWith({
        where: { id: "uuid-1" },
        data: {
          fullname: "New Name",
          bio: "New Bio",
          updatedat: expect.any(Date),
        },
      });
    });
  });

  describe("softDeleteAuthor", () => {
    it("should soft delete author", async () => {
      prisma.authors.findFirst.mockResolvedValue({ id: "uuid-1" });
      prisma.authors.update.mockResolvedValue({
        id: "uuid-1",
        deletedat: new Date(),
      });

      await authorService.softDeleteAuthor("uuid-1");

      expect(prisma.authors.update).toHaveBeenCalledWith({
        where: { id: "uuid-1" },
        data: {
          deletedat: expect.any(Date),
          updatedat: expect.any(Date),
        },
      });
    });

    it("should throw 404 if author not found", async () => {
      prisma.authors.findFirst.mockResolvedValue(null);

      await expect(
        authorService.softDeleteAuthor("non-existent")
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should set both deletedat and updatedat", async () => {
      prisma.authors.findFirst.mockResolvedValue({ id: "uuid-1" });
      prisma.authors.update.mockResolvedValue({});

      await authorService.softDeleteAuthor("uuid-1");

      const updateCall = prisma.authors.update.mock.calls[0][0];
      expect(updateCall.data).toHaveProperty("deletedat");
      expect(updateCall.data).toHaveProperty("updatedat");
    });
  });

  describe("listAuthorBooks", () => {
    it("should return author books with pagination", async () => {
      const mockBooks = [
        { id: "book-1", title: "Book 1", authorid: "uuid-1" },
        { id: "book-2", title: "Book 2", authorid: "uuid-1" },
      ];

      prisma.authors.findFirst.mockResolvedValue({ id: "uuid-1" });
      prisma.books.findMany.mockResolvedValue(mockBooks);
      prisma.books.count.mockResolvedValue(15);

      const result = await authorService.listAuthorBooks("uuid-1", {
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

    it("should throw 404 if author not found", async () => {
      prisma.authors.findFirst.mockResolvedValue(null);

      await expect(
        authorService.listAuthorBooks("non-existent", {})
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should filter books by search query", async () => {
      prisma.authors.findFirst.mockResolvedValue({ id: "uuid-1" });
      prisma.books.findMany.mockResolvedValue([]);
      prisma.books.count.mockResolvedValue(0);

      await authorService.listAuthorBooks("uuid-1", {
        search: "1984",
      });

      expect(prisma.books.findMany).toHaveBeenCalledWith({
        where: {
          deletedat: null,
          authorid: "uuid-1",
          title: { contains: "1984", mode: "insensitive" },
        },
        skip: 0,
        take: 10,
        orderBy: { createdat: "desc" },
      });
    });

    it("should order books by createdat desc", async () => {
      prisma.authors.findFirst.mockResolvedValue({ id: "uuid-1" });
      prisma.books.findMany.mockResolvedValue([]);
      prisma.books.count.mockResolvedValue(0);

      await authorService.listAuthorBooks("uuid-1", {});

      const findManyCall = prisma.books.findMany.mock.calls[0][0];
      expect(findManyCall.orderBy).toEqual({ createdat: "desc" });
    });

    it("should exclude soft deleted books", async () => {
      prisma.authors.findFirst.mockResolvedValue({ id: "uuid-1" });
      prisma.books.findMany.mockResolvedValue([]);
      prisma.books.count.mockResolvedValue(0);

      await authorService.listAuthorBooks("uuid-1", {});

      const whereClause = prisma.books.findMany.mock.calls[0][0].where;
      expect(whereClause.deletedat).toBeNull();
    });
  });

  describe("authorExists helper", () => {
    it("should return author if exists", async () => {
      const mockAuthor = { id: "uuid-1", fullname: "Test" };
      prisma.authors.findFirst.mockResolvedValue(mockAuthor);

      await authorService.updateAuthor("uuid-1", { fullname: "Updated" });

      expect(prisma.authors.findFirst).toHaveBeenCalledWith({
        where: { id: "uuid-1", deletedat: null },
      });
    });
  });
});