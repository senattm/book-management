const { prisma } = require("../config/database");

async function bookAvailable(bookId) {
    const book = await prisma.books.findFirst({
        where: {id: bookId, deletedat:null}
    });

    if (!book) {
    const err = new Error("Kitap bulunamadı.");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  if (book.stock <= 0) {
    const err = new Error("Kitap stokta yok, ödünç verilemez.");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  return book;
}

async function borrowingExists(borrowingId) {
  const borrowing = await prisma.borrowings.findFirst({
    where: { id: borrowingId, deletedat: null },
    include: { books: true, users: true },
  });

  if (!borrowing) {
    const err = new Error("Ödünç kaydı bulunamadı.");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }
  return borrowing;
}

function checkSelfOrAdmin(actor, targetUserId) {
  const isAdmin = actor?.role === "admin";
  const isSelf = actor?.id === targetUserId;

  if (!isAdmin && !isSelf) {
    const err = new Error("Sadece kendi kayıtlarınıza erişebilirsiniz.");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }
}

async function listBorrowingsByUser(actor, targetUserId, queryParams) {
  checkSelfOrAdmin(actor, targetUserId);

  const page = Number(queryParams.page ?? 1);
  const limit = Number(queryParams.limit ?? 10);
  
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 10;
  const skip = (safePage - 1) * safeLimit;

  const status = queryParams.status;

  const filter = {
    deletedat: null,
    userid: targetUserId,
    ...(status === "active" ? { returnedat: null } : {}),
    ...(status === "returned" ? { NOT: { returnedat: null } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.borrowings.findMany({
      where: filter,
      skip,
      take: safeLimit,
      orderBy: { borrowedat: "desc" },
      include: {
        books: true
      },
    }),
    prisma.borrowings.count({ where:filter }),
  ]);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalItems: total,
      totalPages: Math.ceil(total / safeLimit),
      hasNextPage: safePage * safeLimit < total,
      hasPrevPage: safePage > 1,
    },
  };
}

async function createBorrowing(actor, payload) {
  if (!actor?.id) {
    const err = new Error("Giriş yapmanız gerekiyor.");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }
  
  const targetUserId = payload.userid || actor.id;
  checkSelfOrAdmin(actor, targetUserId);
 await bookAvailable(payload.bookid);

   const dueAt = payload.dueat
    ? new Date(payload.dueat)
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const created = await prisma.$transaction(async (tx) => {
    const borrowing = await tx.borrowings.create({
      data: {
        userid: targetUserId,
        bookid: payload.bookid,
        dueat: dueAt,
      },
      include: { books: true, users: true },
    });
      await tx.books.update({
      where: { id: payload.bookid },
      data: { stock: { decrement: 1 }, updatedat: new Date() },
    });

    return borrowing;
  });

  return created;
}

async function returnBorrowing(actor, borrowingId) {
  if (!actor?.id) {
    const err = new Error("Giriş yapmanız gerekiyor.");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }

  const borrowing = await borrowingExists(borrowingId);
  checkSelfOrAdmin(actor, borrowing.userid);

  if (borrowing.returnedat) {
    const err = new Error("Bu kitap zaten iade edilmiş.");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

return await prisma.$transaction(async (tx) => {
    const updatedBorrowing = await tx.borrowings.update({
      where: { id: borrowingId },
      data: { 
        returnedat: new Date(), 
        updatedat: new Date() 
      },
      include: { books: true, users: true },
    });

    await tx.books.update({
      where: { id: updatedBorrowing.bookid },
      data: { 
        stock: { increment: 1 }, 
        updatedat: new Date() 
      },
    });

    return updatedBorrowing;
  });
}

async function listOverdueBorrowings(actor, queryParams) {
  if (actor?.role !== "admin") {
    const err = new Error("Bu işlem için yetkiniz bulunmamaktadır.");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  const page = Number(queryParams.page ?? 1);
  const limit = Number(queryParams.limit ?? 10);
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 10;
  const skip = (safePage - 1) * safeLimit;

  const filter = {
    deletedat: null,
    returnedat: null,
    dueat: { lt: new Date() },
  };

  const [items, total] = await Promise.all([
    prisma.borrowings.findMany({
      where: filter,
      skip,
      take: safeLimit,
      orderBy: { dueat: "asc" },
      include: { books: true, users: true },
    }),
    prisma.borrowings.count({ where: filter }),
  ]);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalItems: total,
      totalPages: Math.ceil(total / safeLimit),
      hasNextPage: safePage * safeLimit < total,
      hasPrevPage: safePage > 1,
    },
  };
}

module.exports = {
  listBorrowingsByUser,
  createBorrowing,
  returnBorrowing,
  listOverdueBorrowings,
};