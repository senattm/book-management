const { prisma } = require("../config/database");
const bcrypt = require("bcrypt");

function sanitizeUser(user) {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
}

async function userExists(userId) {
  const user = await prisma.users.findFirst({
    where: { id: userId, deletedat: null },
  });

  if (!user) {
    const err = new Error("Kullanıcı bulunamadı.");
     err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }
  return user;
}

async function listUsers(queryParams) {
  const page = Number(queryParams.page ?? 1);
  const limit = Number(queryParams.limit ?? 10);

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit =
    Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 10;
  const skip = (safePage - 1) * safeLimit;

  const filter = {
    deletedat: null,
    ...(queryParams.search
      ? {
          OR: [
            { name: { contains: queryParams.search, mode: "insensitive" } },
            { email: { contains: queryParams.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(queryParams.role ? { role: queryParams.role } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.users.findMany({
      where: filter,
      skip,
      take: safeLimit,
    }),
    prisma.users.count({ where: filter }),
  ]);

  return {
    items: items.map(sanitizeUser),
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

async function getUserById(userId) {
  const user = await prisma.users.findFirst({
    where: { id: userId, deletedat: null },
  });

  if (!user) {
    const err = new Error("Kullanıcı bulunamadı.");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }
  return sanitizeUser(user);
}

async function updateUser(actor, targetUserId, payload) {
  const targetUser = await getUserById(targetUserId);

  const isAdmin = actor?.role === "admin";
  const isSelf = actor?.id === targetUserId;

  if (!isAdmin && !isSelf) {
    const err = new Error("Sadece kendi profilinizi güncelleyebilirsiniz.");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  if (targetUser.role === "admin" && !isAdmin) {
    const err = new Error("Admin sadece bir admin tarafından güncellenebilir.");
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  const allowedFields = ['email', 'name', 'avatar', 'password'];
  const data = {};

   allowedFields.forEach(field => {
    if (payload[field] !== undefined) {
      data[field] = payload[field];
    }
  });

  if (payload.password !== undefined) {
    data.password = await bcrypt.hash(payload.password, 10);
  }

  if (Object.keys(data).length === 0) {
    const err = new Error("Güncelleme için en az bir alan gönderilmelidir.");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  data.updatedat = new Date();

  try {
    const updated = await prisma.users.update({
      where: { id: targetUserId },
      data,
    });
    return sanitizeUser(updated);
  } catch (e) {
    const err = new Error("Güncelleme sırasında hata.");
    err.statusCode = 409;
    err.code = "CONFLICT";
    throw err;
  }
}

async function softDeleteUser(userId) {
  await userExists(userId);

  const deleted = await prisma.users.update({
    where: { id: userId },
    data: { deletedat: new Date(), updatedat: new Date() },
  });
  return deleted;
}

async function getMe(actor) {
  return getUserById(actor.id);
}


module.exports = { listUsers, getUserById, updateUser, softDeleteUser, getMe };
