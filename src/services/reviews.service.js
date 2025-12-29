const { prisma } = require("../config/database");

async function bookExists(bookId) {
  const book = await prisma.books.findFirst({
    where: { id: bookId, deletedat: null },
    select: { id: true },
  });
  if (!book) {
    const err = new Error("Kitap bulunamadı.");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }
}

async function reviewExists(reviewId) {
  const review = await prisma.reviews.findFirst({
    where: { id: reviewId, deletedat: null },
  });
  if (!review) {
    const err = new Error("Değerlendirme bulunamadı.");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }
  return review;
}

function isOwnerOrAdmin(review, user) {
  if (!user) {
    const err = new Error("Giriş gerekli.");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }

  const isAdmin = user.role === "admin";
  const isOwner = review.userid === user.id;

  if (!isAdmin && !isOwner) {
    const err = new Error("Bu işlem için yetkiniz bulunmamaktadır.");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }
}


async function getAllReviews(queryParams) {
  const page = Number(queryParams.page ?? 1);
  const limit = Number(queryParams.limit ?? 10);

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 10;

  const skip = (safePage - 1) * safeLimit;

  const where = { 
    deletedat: null,
    ...(queryParams.bookId ? { bookid: queryParams.bookId } : {}),
    ...(queryParams.userId ? { userid: queryParams.userId } : {}),
  };

  const [reviews, total] = await Promise.all([
    prisma.reviews.findMany({
      where,
      include: {
        users: { select: { id: true, name: true } },
        books: { select: { id: true, title: true } },
      },
      orderBy: { createdat: "desc" },
      skip,
      take: safeLimit,
    }),
    prisma.reviews.count({ where }),
  ]);

  return {
    reviews,
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalItems: total,
      totalPages: Math.ceil(total / safeLimit),
      hasNextPage: safePage < Math.ceil(total / safeLimit),
      hasPrevPage: safePage > 1,
    },
  };
}

async function listReviewsByBook(bookId) {
  await bookExists(bookId);

  return prisma.reviews.findMany({
    where: { bookid: bookId, deletedat: null },
    include: {
      users: { select: { id: true, name: true } },
    },
    orderBy: { createdat: "desc" },
  });
}

async function createReview(bookId, user, payload) {
  if (!user?.id) {
    const err = new Error("Giriş gerekli.");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }

  await bookExists(bookId);

  const existing = await prisma.reviews.findFirst({
    where: { bookid: bookId, userid: user.id, deletedat: null },
    select: { id: true },
  });

  if (existing) {
    const err = new Error("Bir kitap için yalnızca bir değerlendirme yapılabilir.");
    err.statusCode = 409;
    err.code = "CONFLICT";
    throw err;
  }

  return prisma.reviews.create({
    data: {
      bookid: bookId,
      userid: user.id,
      rating: payload.rating, 
      comment: payload.comment ? payload.comment.trim() : null,
    },
    include: {
      users: { select: { id: true, name: true } },
    },
  });
}

async function updateReview(reviewId, user, payload) {
  const review = await reviewExists(reviewId);
  isOwnerOrAdmin(review, user);

  const prepared = {
    ...(payload.rating !== undefined ? { rating: payload.rating } : {}),
    ...(payload.comment !== undefined
      ? { comment: payload.comment === null ? null : payload.comment.trim() }
      : {}),
    updatedat: new Date(),
  };

  return prisma.reviews.update({
    where: { id: reviewId },
    data: prepared,
    include: { users: { select: { id: true, name: true } } },
  });
}

async function softDeleteReview(reviewId, user) {
  const review = await reviewExists(reviewId);
  isOwnerOrAdmin(review, user);

  await prisma.reviews.update({
    where: { id: reviewId },
    data: { deletedat: new Date(), updatedat: new Date() },
  });
}

module.exports = {
  getAllReviews,
  listReviewsByBook,
  createReview,
  updateReview,
  softDeleteReview,
};