const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { prisma } = require("../config/database");

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, type: "access" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );
  const refreshToken = jwt.sign(
    { id: user.id, role: user.role, type: "refresh" },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
  return { accessToken, refreshToken };
};

const sanitizeUser = (user) => {
  const { password, ...rest } = user;
  return rest;
};

const register = async ({ name, email, password }) => {
const existing = await prisma.users.findFirst({
  where: { email, deletedat: null },
});
 if (existing) {
    const err = new Error("Bu email zaten kayıtlı.");
    err.statusCode = 409;
    err.code = "CONFLICT";
    throw err;
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.users.create({
    data: { name, email, password: hashed, role: "user" },
  });
  return { user: sanitizeUser(user), ...generateTokens(user) };
};

const login = async ({ email, password }) => {
  const user = await prisma.users.findFirst({
    where: { email, deletedat: null },
  });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    const err = new Error("Email veya şifre hatalı.");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }
  return { user: sanitizeUser(user), ...generateTokens(user) };
};

const refresh = async ({ refreshToken }) => {
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  } catch (_e) {
    const err = new Error("Geçersiz oturum.");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }
  if (payload.type !== "refresh") {
    const err = new Error("Geçersiz token tipi.");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }
  const user = await prisma.users.findFirst({ where: { id: payload.id, deletedat: null } });
  if (!user) {
    const err = new Error("Kullanıcı bulunamadı.");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }
  return generateTokens(user);
};

const logout = async (_userId) => {
  return { success: true };
};

const forgotPassword = async (email) => {
  const user = await prisma.users.findFirst({
    where: { email, deletedat: null },
  });

  if (!user) return;

  const resetToken = jwt.sign(
    { id: user.id, type: "reset" },
    process.env.JWT_RESET_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_RESET_EXPIRES_IN || "15m" }
  );

  if (process.env.RETURN_RESET_TOKEN === "true") {
    return { resetToken };
  }
};

const resetPassword = async ({ token, password }) => {
  let payload;
  try {
    payload = jwt.verify(
      token,
      process.env.JWT_RESET_SECRET || process.env.JWT_SECRET
    );
  } catch (_e) {
    const err = new Error("Geçersiz veya süresi dolmuş token.");
    err.statusCode = 400;
    err.code = "BAD_REQUEST";
    throw err;
  }

  if (payload.type !== "reset") {
    const err = new Error("Geçersiz token tipi.");
    err.statusCode = 400;
    err.code = "BAD_REQUEST";
    throw err;
  }

  const user = await prisma.users.findFirst({
    where: { id: payload.id, deletedat: null },
  });

  if (!user) {
    const err = new Error("Kullanıcı bulunamadı.");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.users.update({
    where: { id: user.id },
    data: { password: hashed, updatedat: new Date() },
  });
};


module.exports = { register, login, refresh, logout, forgotPassword, resetPassword };