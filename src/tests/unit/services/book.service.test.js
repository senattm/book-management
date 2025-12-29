jest.mock("../../../config/database", () => {
  const { mockDeep } = require("jest-mock-extended");
  return { prisma: mockDeep() };
});

const { prisma } = require("../../../config/database");
const bookService = require("../../../services/book.service");

describe("Book Service - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createBook", () => {
    it("should throw 404 when author not found", async () => {
      prisma.authors.findFirst.mockResolvedValue(null);

      await expect(
        bookService.createBook({
          title: "X",
          isbn: "978-0132350884",
          authorid: "123e4567-e89b-12d3-a456-426614174000",
          categoryid: "223e4567-e89b-12d3-a456-426614174000",
        })
      ).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });

      expect(prisma.authors.findFirst).toHaveBeenCalled();
      expect(prisma.categories.findFirst).not.toHaveBeenCalled();
      expect(prisma.books.create).not.toHaveBeenCalled();
    });

    it("should throw 404 when category not found", async () => {
      prisma.authors.findFirst.mockResolvedValue({ id: "a1" });
      prisma.categories.findFirst.mockResolvedValue(null);

      await expect(
        bookService.createBook({
          title: "X",
          isbn: "978-0132350884",
          authorid: "123e4567-e89b-12d3-a456-426614174000",
          categoryid: "223e4567-e89b-12d3-a456-426614174000",
        })
      ).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });

      expect(prisma.books.create).not.toHaveBeenCalled();
    });

    it("should prepare data (trim, defaults) and create", async () => {
      prisma.authors.findFirst.mockResolvedValue({ id: "a1" });
      prisma.categories.findFirst.mockResolvedValue({ id: "c1" });

      prisma.books.create.mockResolvedValue({
        id: "b1",
        title: "My Book",
        isbn: "978-0132350884",
      });

      const res = await bookService.createBook({
        title: "  My Book  ",
        isbn: " 978-0132350884 ",
        authorid: "123e4567-e89b-12d3-a456-426614174000",
        categoryid: "223e4567-e89b-12d3-a456-426614174000",
        description: "",
        publishedat: null,
        stock: undefined,
      });

      expect(prisma.books.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "My Book",
          isbn: "978-0132350884",
          description: null,
          publishedat: null,
          stock: 0,
        }),
      });

      expect(res.id).toBe("b1");
    });

    it("should parse stock to int", async () => {
      prisma.authors.findFirst.mockResolvedValue({ id: "a1" });
      prisma.categories.findFirst.mockResolvedValue({ id: "c1" });
      prisma.books.create.mockResolvedValue({ id: "b1" });

      await bookService.createBook({
        title: "My Book",
        isbn: "978-0132350884",
        authorid: "123e4567-e89b-12d3-a456-426614174000",
        categoryid: "223e4567-e89b-12d3-a456-426614174000",
        stock: "12",
      });

      expect(prisma.books.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ stock: 12 }),
      });
    });
  });

  describe("listBooks", () => {
    it("should sanitize invalid page/limit to defaults and return pagination", async () => {
      prisma.books.findMany.mockResolvedValue([{ id: "b1" }]);
      prisma.books.count.mockResolvedValue(1);

      const res = await bookService.listBooks({ page: 0, limit: 0 });

      expect(prisma.books.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: { createdat: "desc" },
          include: { authors: true, categories: true },
        })
      );

      expect(res.pagination.page).toBe(1);
      expect(res.pagination.limit).toBe(10);
      expect(res.pagination.totalItems).toBe(1);
      expect(res.items.length).toBe(1);
    });

    it("should build where with search OR title/isbn + filters", async () => {
      prisma.books.findMany.mockResolvedValue([]);
      prisma.books.count.mockResolvedValue(0);

      await bookService.listBooks({
        page: 2,
        limit: 5,
        search: "abc",
        authorid: "123e4567-e89b-12d3-a456-426614174000",
        categoryid: "223e4567-e89b-12d3-a456-426614174000",
      });

      expect(prisma.books.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedat: null,
            authorid: "123e4567-e89b-12d3-a456-426614174000",
            categoryid: "223e4567-e89b-12d3-a456-426614174000",
            OR: [
              { title: { contains: "abc", mode: "insensitive" } },
              { isbn: { contains: "abc", mode: "insensitive" } },
            ],
          }),
          skip: 5,
          take: 5,
        })
      );
    });
  });

  describe("getBookById", () => {
    it("should throw 404 when not found", async () => {
      prisma.books.findFirst.mockResolvedValue(null);

      await expect(bookService.getBookById("b1")).rejects.toMatchObject({
        statusCode: 404,
        code: "NOT_FOUND",
      });
    });

    it("should return book with includes", async () => {
      prisma.books.findFirst.mockResolvedValue({ id: "b1" });

      const res = await bookService.getBookById("b1");

      expect(prisma.books.findFirst).toHaveBeenCalledWith({
        where: { id: "b1", deletedat: null },
        include: { authors: true, categories: true },
      });

      expect(res.id).toBe("b1");
    });
  });

  describe("updateBook", () => {
    it("should validate author if authorid provided", async () => {
      prisma.books.findFirst.mockResolvedValue({ id: "b1" }); 
      prisma.authors.findFirst.mockResolvedValue(null); 

      await expect(
        bookService.updateBook("b1", { authorid: "123e4567-e89b-12d3-a456-426614174000" })
      ).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });

      expect(prisma.books.update).not.toHaveBeenCalled();
    });

    it("should validate category if categoryid provided", async () => {
      prisma.books.findFirst.mockResolvedValue({ id: "b1" });
      prisma.authors.findFirst.mockResolvedValue({ id: "a1" }); 
      prisma.categories.findFirst.mockResolvedValue(null);

      await expect(
        bookService.updateBook("b1", { categoryid: "223e4567-e89b-12d3-a456-426614174000" })
      ).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });

      expect(prisma.books.update).not.toHaveBeenCalled();
    });

    it("should build prepared update payload and update", async () => {
      prisma.books.findFirst.mockResolvedValue({ id: "b1" });
      prisma.books.update.mockResolvedValue({ id: "b1", title: "New" });

      const res = await bookService.updateBook("b1", {
        title: "  New  ",
        description: null,
        stock: "7",
      });

      expect(prisma.books.update).toHaveBeenCalledWith({
        where: { id: "b1" },
        data: expect.objectContaining({
          title: "New",
          description: null,
          stock: 7,
          updatedat: expect.any(Date),
        }),
      });

      expect(res.title).toBe("New");
    });
  });

  describe("softDeleteBook", () => {
    it("should set deletedat and updatedat", async () => {
      prisma.books.findFirst.mockResolvedValue({ id: "b1" });
      prisma.books.update.mockResolvedValue({ id: "b1" });

      await bookService.softDeleteBook("b1");

      expect(prisma.books.update).toHaveBeenCalledWith({
        where: { id: "b1" },
        data: { deletedat: expect.any(Date), updatedat: expect.any(Date) },
      });
    });
  });

  describe("getBookReviews", () => {
    it("should verify book exists then return reviews", async () => {
      prisma.books.findFirst.mockResolvedValue({ id: "b1" });
      prisma.reviews.findMany.mockResolvedValue([{ id: "r1" }]);

      const res = await bookService.getBookReviews("b1");

      expect(prisma.reviews.findMany).toHaveBeenCalledWith({
        where: { bookid: "b1", deletedat: null },
        include: { users: { select: { name: true } } },
      });

      expect(res.length).toBe(1);
    });
  });
});
