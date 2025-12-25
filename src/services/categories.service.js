const { prisma } = require("../config/database");

async function categoryExists(categoryId) {
  const category = await prisma.categories.findFirst({
    where: { id: categoryId, deletedat: null },
  });

  if (!category) {
    const err = new Error("Kategori bulunamadı.");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }
  return category;
}

async function parentExists(parentid) {
  if (!parentid) return null;
  const parent = await prisma.categories.findFirst({
    where: { id: parentid, deletedat: null },
    select: { id: true },
  });

  if (!parent) {
    const err = new Error("Üst kategori bulunamadı.");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }
  return parent;
}

async function createCategory(payload) {
  await parentExists(payload.parentid);

  const created = await prisma.categories.create({
    data: {
      categoryname: payload.categoryname.trim(),
      parentid: payload.parentid ?? null,
    },
  });
  return created;
}

async function listCategories(queryParams) {
  const page = Number(queryParams.page ?? 1);
  const limit = Number(queryParams.limit ?? 10);

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit =
    Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 10;
  const skip = (safePage - 1) * safeLimit;

  const filter = {
    deletedat: null,
    ...(queryParams.search
      ? { categoryname: { contains: queryParams.search, mode: "insensitive" } }
      : {}),
    ...(queryParams.parentid ? { parentid: queryParams.parentid } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.categories.findMany({
      where: filter,
      skip,
      take: safeLimit,
      include: {
        categories: true,
        other_categories: true,
      },
    }),
    prisma.categories.count({ where: filter }),
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

async function getCategoryById(categoryId) {
  const category = await prisma.categories.findFirst({
    where: { id: categoryId, deletedat: null },
    include: {
      categories: true,
      other_categories: true,
    },
  });
  if (!category) {
    const err = new Error("Kategori bulunamadı");
    err.status = 404;
    err.statusCode = "NOT_FOUND";
    throw err;
  }
  return category;
}

async function updateCategory(categoryId, payload) {
  await categoryExists(categoryId);

  if (payload.parentid) {
    await parentExists(payload.parentid);
  }

  if (payload.parentid === categoryId) {
    const err = new Error("Kategori kendisini parent olarak alamaz.");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  const updated = await prisma.categories.update({
    where: { id: categoryId },
    data: {
      ...payload,
      updatedat: new Date(),
    },
  });
  return updated;
}

async function softDeleteCategory(categoryId) {
  await categoryExists(categoryId);

  const deleted = await prisma.categories.update({
    where: { id: categoryId },
    data: { deletedat: new Date(), updatedat: new Date() },
  });
  return deleted;
}

async function getCategoryBooks(categoryId, query) {
  await categoryExists(categoryId);

  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit =
    Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 10;
  const skip = (safePage - 1) * safeLimit;

  const filter = {
    deletedat: null,
    categoryid: categoryId,
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: "insensitive" } },
            { isbn: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.books.findMany({
      where: filter,
      skip,
      take: safeLimit,
      include: { authors: true, categories: true },
    }),
    prisma.books.count({ where: filter }),
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
    createCategory,
  listCategories,
  getCategoryById,
  updateCategory,
  softDeleteCategory,
  getCategoryBooks,
};
