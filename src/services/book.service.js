const { prisma } = require("../config/database");

async function createBook(book) {

    const author = await prisma.authors.findFirst({
    where: { id: book.authorid, deletedat: null },
    select: { id: true },
  });

  if (!author) {
    const err = new Error("Yazar bulunamadı.");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

   const category = await prisma.categories.findFirst({
    where: { id: book.categoryid, deletedat: null },
    select: { id: true },
  });
  if (!category) {
    const err = new Error("Kategori bulunamadı.");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  const preparedData = {
    title: (book.title || "").trim(),
    isbn: (book.isbn || "").trim(),
    authorid: book.authorid,
    categoryid: book.categoryid,
    description: book.description ? book.description : null,
    publishedat: book.publishedat ? new Date(book.publishedat) : null,
    stock: book.stock === undefined ? 0 : parseInt(book.stock),
  };

  const created = await prisma.books.create({
    data: preparedData,
  });
  return created;
}

async function listBooks(query) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit =
    Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 10;

  const skip = (safePage - 1) * safeLimit;

  const where = {
    deletedat: null,
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: "insensitive" } },
            { isbn: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(query.authorid ? { authorid: query.authorid } : {}),
    ...(query.categoryid ? { categoryid: query.categoryid } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.books.findMany({
      where,
      skip,
      take: safeLimit,          
      orderBy: { createdat: "desc" },
      include: { authors: true, categories: true },
    }),
    prisma.books.count({ where }),
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

async function getBookById(id) {
  const book = await prisma.books.findFirst({
    where: { id, deletedat: null },
    include: {
      authors: true,
      categories: true,
    },
  });

  if (!book) {
    const err = new Error("Kitap bulunamadı.");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  return book;
}

async function updateBook(id, data) {
  await getBookById(id);

  if (data.authorid !== undefined) {
    const author = await prisma.authors.findFirst({
      where: { id: data.authorid, deletedat: null },
      select: { id: true },
    });
    if (!author) {
      const err = new Error("Yazar bulunamadı.");
      err.statusCode = 404;
      err.code = "NOT_FOUND";
      throw err;
    }
  }

  if (data.categoryid !== undefined) {
    const category = await prisma.categories.findFirst({
      where: { id: data.categoryid, deletedat: null },
      select: { id: true },
    });
    if (!category) {
      const err = new Error("Kategori bulunamadı.");
      err.statusCode = 404;
      err.code = "NOT_FOUND";
      throw err;
    }
  }

  const prepared = {
    ...(data.title !== undefined ? { title: data.title.trim() } : {}),
    ...(data.isbn !== undefined ? { isbn: data.isbn.trim() } : {}),
    ...(data.authorid !== undefined ? { authorid: data.authorid } : {}),
    ...(data.categoryid !== undefined ? { categoryid: data.categoryid } : {}),
    ...(data.description !== undefined ? { description: data.description ?? null } : {}),
    ...(data.publishedat !== undefined
      ? { publishedat: data.publishedat ? new Date(data.publishedat) : null }
      : {}),
    ...(data.stock !== undefined ? { stock: parseInt(data.stock) } : {}),
    updatedat: new Date(),
  };

  const updated = await prisma.books.update({
    where: { id },
    data: prepared,
  });

  return updated;
}


async function softDeleteBook(id) {
  await getBookById(id);

  const deleted = await prisma.books.update({
    where: { id },
    data: { deletedat: new Date(), updatedat: new Date() },
  });

  return deleted;
}

async function getBookReviews(id) {
  await getBookById(id); 


  const reviews = await prisma.reviews.findMany({
    where: { 
      bookid: id, 
      deletedat: null 
    },
    include: { 
      users: { 
        select: { name: true } 
      } 
    }
  });

  return reviews;
}

module.exports = {
  createBook,
  listBooks,
  getBookById,
  updateBook,
  softDeleteBook,
  getBookReviews
};
