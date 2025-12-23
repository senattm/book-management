const { prisma } = require("../config/database");

async function authorExists(authorId) {
  const author = await prisma.authors.findFirst({
    where: { id: authorId, deletedat: null },
  });

  if (!author) {
    const err = new Error("Yazar bulunamadı.");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }
  return author;
}

async function createAuthor(payload) {
    const created = await prisma.authors.create({
        data: {
            fullname: payload.fullname.trim(),
            bio: payload.bio ? payload.bio.trim() : null,
        },
    });
    return created;
}

async function listAuthors(queryParams) {
 const page = Number(queryParams.page ?? 1);
  const limit = Number(queryParams.limit ?? 10);
  const skip = (page - 1) * limit;

const where = {
    deletedat: null,
    ...(queryParams.search
      ? { fullname: { contains: queryParams.search, mode: "insensitive" } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.authors.findMany({
      where,
      skip,
      take: limit,          
    }),
    prisma.authors.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: page,
      limit: limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
}

async function getAuthorById(authorId) {
  const author = await prisma.authors.findFirst({
    where: { id: authorId, deletedat: null },
  });

  if (!author) {
    const err = new Error("Yazar bulunamadı.");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }
    return author;
}

async function updateAuthor(authorId, payload) {
    await authorExists(authorId);
      const prepared = {
    ...(payload.fullname !== undefined ? { fullname: payload.fullname.trim() } : {}),
    ...(payload.bio !== undefined ? { bio: payload.bio === null ? null : payload.bio.trim() } : {}),
    updatedat: new Date(),
  };

  const updated = await prisma.authors.update({
where: {id: authorId},
data: prepared
  });
    return updated;
}

async function softDeleteAuthor(authorId) {
    await authorExists(authorId);
    return prisma.authors.update({
        where: {id: authorId},
        data: {deletedat: new Date(), updatedat: new Date()},
    });
    
}

module.exports = {
  createAuthor,
  listAuthors,     
  getAuthorById,
  updateAuthor,
  softDeleteAuthor,
};
