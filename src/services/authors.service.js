const { prisma } = require("../config/database");
const {
  CacheKeys,
  getCached,
  invalidateAuthorCache,
  invalidateAllAuthorsCache,
  CACHE_TTL,
  SINGLE_ITEM_TTL,
} = require("./cache.service");

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

  await invalidateAllAuthorsCache();

  return created;
}

async function listAuthors(queryParams) {
  const cacheKey = CacheKeys.authorsList(queryParams);

  return getCached(
    cacheKey,
    async () => {
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
    },
    CACHE_TTL
  );
}

async function getAuthorById(authorId) {
  const cacheKey = CacheKeys.author(authorId);

  return getCached(
    cacheKey,
    async () => {
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
    },
    SINGLE_ITEM_TTL
  );
}

async function updateAuthor(authorId, payload) {
  await authorExists(authorId);
  const prepared = {
    ...(payload.fullname !== undefined ? { fullname: payload.fullname.trim() } : {}),
    ...(payload.bio !== undefined ? { bio: payload.bio === null ? null : payload.bio.trim() } : {}),
    updatedat: new Date(),
  };

  const updated = await prisma.authors.update({
    where: { id: authorId },
    data: prepared,
  });

  await invalidateAuthorCache(authorId);

  return updated;
}

async function softDeleteAuthor(authorId) {
  await authorExists(authorId);
  const deleted = await prisma.authors.update({
    where: { id: authorId },
    data: { deletedat: new Date(), updatedat: new Date() },
  });

  await invalidateAuthorCache(authorId);

  return deleted;
}

async function listAuthorBooks(authorId, queryParams) {
  await authorExists(authorId);

  const cacheKey = CacheKeys.authorBooks(authorId, queryParams);

  return getCached(
    cacheKey,
    async () => {
      const page = Number(queryParams.page ?? 1);
      const limit = Number(queryParams.limit ?? 10);
      const skip = (page - 1) * limit;

      const where = {
        deletedat: null,
        authorid: authorId,
        ...(queryParams.search
          ? { title: { contains: queryParams.search, mode: "insensitive" } }
          : {}),
      };

      const [items, total] = await Promise.all([
        prisma.books.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdat: "desc" },
        }),
        prisma.books.count({ where }),
      ]);

      return {
        items,
        pagination: {
          page,
          limit,
          totalItems: total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      };
    },
    CACHE_TTL
  );
}


module.exports = {
  createAuthor,
  listAuthors,     
  getAuthorById,
  updateAuthor,
  softDeleteAuthor,
  listAuthorBooks
};
