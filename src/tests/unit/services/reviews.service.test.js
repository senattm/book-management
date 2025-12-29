jest.mock("../../../config/database", () => ({
  prisma: {
    books: {
      findFirst: jest.fn(),
    },
    reviews: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const reviewService = require("../../../services/reviews.service");
const { prisma } = require("../../../config/database");

describe("ReviewService - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllReviews", () => {
    it("should return paginated reviews", async () => {
      const mockReviews = [
        { id: "1", rating: 5, comment: "Great" },
        { id: "2", rating: 4, comment: "Good" },
      ];

      prisma.reviews.findMany.mockResolvedValue(mockReviews);
      prisma.reviews.count.mockResolvedValue(25);

      const result = await reviewService.getAllReviews({
        page: 1,
        limit: 10,
      });

      expect(result.reviews).toEqual(mockReviews);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        totalItems: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: false,
      });
    });

    it("should filter by bookId", async () => {
      prisma.reviews.findMany.mockResolvedValue([]);
      prisma.reviews.count.mockResolvedValue(0);

      await reviewService.getAllReviews({
        bookId: "book-uuid",
        page: 1,
        limit: 10,
      });

      expect(prisma.reviews.findMany).toHaveBeenCalledWith({
        where: {
          deletedat: null,
          bookid: "book-uuid",
        },
        include: {
          users: { select: { id: true, name: true } },
          books: { select: { id: true, title: true } },
        },
        orderBy: { createdat: "desc" },
        skip: 0,
        take: 10,
      });
    });

    it("should filter by userId", async () => {
      prisma.reviews.findMany.mockResolvedValue([]);
      prisma.reviews.count.mockResolvedValue(0);

      await reviewService.getAllReviews({
        userId: "user-uuid",
        page: 1,
        limit: 10,
      });

      expect(prisma.reviews.findMany).toHaveBeenCalledWith({
        where: {
          deletedat: null,
          userid: "user-uuid",
        },
        include: {
          users: { select: { id: true, name: true } },
          books: { select: { id: true, title: true } },
        },
        orderBy: { createdat: "desc" },
        skip: 0,
        take: 10,
      });
    });
  });

  describe("listReviewsByBook", () => {
    it("should return reviews for a book", async () => {
      const mockReviews = [
        { id: "1", rating: 5, bookid: "book-uuid" },
        { id: "2", rating: 4, bookid: "book-uuid" },
      ];

      prisma.books.findFirst.mockResolvedValue({ id: "book-uuid" });
      prisma.reviews.findMany.mockResolvedValue(mockReviews);

      const result = await reviewService.listReviewsByBook("book-uuid");

      expect(result).toEqual(mockReviews);
      expect(prisma.reviews.findMany).toHaveBeenCalledWith({
        where: { bookid: "book-uuid", deletedat: null },
        include: {
          users: { select: { id: true, name: true } },
        },
        orderBy: { createdat: "desc" },
      });
    });

    it("should throw 404 if book not found", async () => {
      prisma.books.findFirst.mockResolvedValue(null);

      await expect(
        reviewService.listReviewsByBook("non-existent")
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Kitap bulunamadı.",
      });
    });
  });

  describe("createReview", () => {
    it("should create review", async () => {
      const user = { id: "user-uuid", role: "user" };
      const mockReview = {
        id: "review-uuid",
        bookid: "book-uuid",
        userid: "user-uuid",
        rating: 5,
        comment: "Great book!",
      };

      prisma.books.findFirst.mockResolvedValue({ id: "book-uuid" });
      prisma.reviews.findFirst.mockResolvedValue(null);
      prisma.reviews.create.mockResolvedValue(mockReview);

      const result = await reviewService.createReview("book-uuid", user, {
        rating: 5,
        comment: "Great book!",
      });

      expect(result).toEqual(mockReview);
      expect(prisma.reviews.create).toHaveBeenCalledWith({
        data: {
          bookid: "book-uuid",
          userid: "user-uuid",
          rating: 5,
          comment: "Great book!",
        },
        include: {
          users: { select: { id: true, name: true } },
        },
      });
    });

    it("should trim comment", async () => {
      const user = { id: "user-uuid" };
      prisma.books.findFirst.mockResolvedValue({ id: "book-uuid" });
      prisma.reviews.findFirst.mockResolvedValue(null);
      prisma.reviews.create.mockResolvedValue({});

      await reviewService.createReview("book-uuid", user, {
        rating: 5,
        comment: "  Trimmed comment  ",
      });

      expect(prisma.reviews.create).toHaveBeenCalledWith({
        data: {
          bookid: "book-uuid",
          userid: "user-uuid",
          rating: 5,
          comment: "Trimmed comment",
        },
        include: {
          users: { select: { id: true, name: true } },
        },
      });
    });

    it("should throw 404 if book not found", async () => {
      const user = { id: "user-uuid" };
      prisma.books.findFirst.mockResolvedValue(null);

      await expect(
        reviewService.createReview("non-existent", user, { rating: 5 })
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should throw 409 if review already exists", async () => {
      const user = { id: "user-uuid" };
      prisma.books.findFirst.mockResolvedValue({ id: "book-uuid" });
      prisma.reviews.findFirst.mockResolvedValue({ id: "existing-review" });

      await expect(
        reviewService.createReview("book-uuid", user, { rating: 5 })
      ).rejects.toMatchObject({
        statusCode: 409,
        message: "Bir kitap için yalnızca bir değerlendirme yapılabilir.",
      });
    });
  });

  describe("updateReview", () => {
    it("should update own review", async () => {
      const user = { id: "user-uuid", role: "user" };
      const existingReview = {
        id: "review-uuid",
        userid: "user-uuid",
        rating: 3,
        comment: "Old comment",
      };
      const updatedReview = {
        id: "review-uuid",
        rating: 5,
        comment: "New comment",
      };

      prisma.reviews.findFirst.mockResolvedValue(existingReview);
      prisma.reviews.update.mockResolvedValue(updatedReview);

      const result = await reviewService.updateReview("review-uuid", user, {
        rating: 5,
        comment: "New comment",
      });

      expect(result).toEqual(updatedReview);
      expect(prisma.reviews.update).toHaveBeenCalledWith({
        where: { id: "review-uuid" },
        data: {
          rating: 5,
          comment: "New comment",
          updatedat: expect.any(Date),
        },
        include: { users: { select: { id: true, name: true } } },
      });
    });

    it("should allow admin to update any review", async () => {
      const admin = { id: "admin-uuid", role: "admin" };
      const existingReview = {
        id: "review-uuid",
        userid: "other-user-uuid",
        rating: 3,
      };

      prisma.reviews.findFirst.mockResolvedValue(existingReview);
      prisma.reviews.update.mockResolvedValue({});

      await reviewService.updateReview("review-uuid", admin, { rating: 5 });

      expect(prisma.reviews.update).toHaveBeenCalled();
    });

    it("should throw 403 if user is not owner or admin", async () => {
      const user = { id: "user-uuid", role: "user" };
      const existingReview = {
        id: "review-uuid",
        userid: "other-user-uuid",
        rating: 3,
      };

      prisma.reviews.findFirst.mockResolvedValue(existingReview);

      await expect(
        reviewService.updateReview("review-uuid", user, { rating: 5 })
      ).rejects.toMatchObject({
        statusCode: 403,
        message: "Bu işlem için yetkiniz bulunmamaktadır.",
      });
    });

    it("should throw 401 if user is not provided", async () => {
      const existingReview = {
        id: "review-uuid",
        userid: "user-uuid",
      };

      prisma.reviews.findFirst.mockResolvedValue(existingReview);

      await expect(
        reviewService.updateReview("review-uuid", null, { rating: 5 })
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Giriş gerekli.",
      });
    });

    it("should handle null comment", async () => {
      const user = { id: "user-uuid", role: "user" };
      const existingReview = {
        id: "review-uuid",
        userid: "user-uuid",
        comment: "Will be null",
      };

      prisma.reviews.findFirst.mockResolvedValue(existingReview);
      prisma.reviews.update.mockResolvedValue({});

      await reviewService.updateReview("review-uuid", user, { comment: null });

      expect(prisma.reviews.update).toHaveBeenCalledWith({
        where: { id: "review-uuid" },
        data: {
          comment: null,
          updatedat: expect.any(Date),
        },
        include: { users: { select: { id: true, name: true } } },
      });
    });

    it("should throw 404 if review not found", async () => {
      const user = { id: "user-uuid" };
      prisma.reviews.findFirst.mockResolvedValue(null);

      await expect(
        reviewService.updateReview("non-existent", user, { rating: 5 })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Değerlendirme bulunamadı.",
      });
    });
  });

  describe("softDeleteReview", () => {
    it("should soft delete own review", async () => {
      const user = { id: "user-uuid", role: "user" };
      const existingReview = {
        id: "review-uuid",
        userid: "user-uuid",
      };

      prisma.reviews.findFirst.mockResolvedValue(existingReview);
      prisma.reviews.update.mockResolvedValue({});

      await reviewService.softDeleteReview("review-uuid", user);

      expect(prisma.reviews.update).toHaveBeenCalledWith({
        where: { id: "review-uuid" },
        data: {
          deletedat: expect.any(Date),
          updatedat: expect.any(Date),
        },
      });
    });

    it("should allow admin to delete any review", async () => {
      const admin = { id: "admin-uuid", role: "admin" };
      const existingReview = {
        id: "review-uuid",
        userid: "other-user-uuid",
      };

      prisma.reviews.findFirst.mockResolvedValue(existingReview);
      prisma.reviews.update.mockResolvedValue({});

      await reviewService.softDeleteReview("review-uuid", admin);

      expect(prisma.reviews.update).toHaveBeenCalled();
    });

    it("should throw 403 if user is not owner or admin", async () => {
      const user = { id: "user-uuid", role: "user" };
      const existingReview = {
        id: "review-uuid",
        userid: "other-user-uuid",
      };

      prisma.reviews.findFirst.mockResolvedValue(existingReview);

      await expect(
        reviewService.softDeleteReview("review-uuid", user)
      ).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it("should throw 404 if review not found", async () => {
      const user = { id: "user-uuid" };
      prisma.reviews.findFirst.mockResolvedValue(null);

      await expect(
        reviewService.softDeleteReview("non-existent", user)
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});

