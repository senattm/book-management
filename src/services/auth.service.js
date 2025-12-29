const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { prisma } = require("../config/database");
const { redis } = require("../config/redis");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

function parseExpiresToSeconds(expiresIn) {
  const m = String(expiresIn).match(/^(\d+)\s*([smhd])$/i);
  if (!m) return 7 * 24 * 60 * 60;
  const value = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const mult = { s: 1, m: 60, h: 3600, d: 86400 }[unit] || 86400;
  return value * mult;
}

const refreshTokenKey = (jti) => `refresh:token:${jti}`;
const userRefreshTokensSetKey = (userId) => `user:${userId}:refresh_tokens`;

async function storeRefreshToken({ userId, jti }) {
  try {
    const ttl = parseExpiresToSeconds(process.env.JWT_REFRESH_EXPIRES_IN || "7d");
    await redis.set(refreshTokenKey(jti), String(userId), { EX: ttl });
    await redis.sAdd(userRefreshTokensSetKey(userId), jti);
    await redis.expire(userRefreshTokensSetKey(userId), ttl);
  } catch (err) {
    console.error("Redis storeRefreshToken error:", err);
    const apiErr = new Error("Oturum kaydedilemedi. Lütfen tekrar deneyin.");
    apiErr.statusCode = 500;
    apiErr.code = "INTERNAL_SERVER_ERROR";
    throw apiErr;
  }
}

async function revokeRefreshToken({ userId, jti }) {
  try {
    await redis.del(refreshTokenKey(jti));
    await redis.sRem(userRefreshTokensSetKey(userId), jti);
  } catch (err) {
    console.error("Redis revokeRefreshToken error:", err);
    const apiErr = new Error("Çıkış işlemi tamamlanamadı.");
    apiErr.statusCode = 500;
    apiErr.code = "INTERNAL_SERVER_ERROR";
    throw apiErr;
  }
}

async function isRefreshTokenActive({ userId, jti }) {
  const val = await redis.get(refreshTokenKey(jti));
  return val === String(userId);
}

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, type: "access" },
    JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );

  const refreshJti = crypto.randomUUID();

  const refreshToken = jwt.sign(
    { id: user.id, role: user.role, type: "refresh", jti: refreshJti },
    JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );

  return { accessToken, refreshToken, refreshJti };
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

  const tokens = generateTokens(user);
  await storeRefreshToken({ userId: user.id, jti: tokens.refreshJti });

  return {
    user: sanitizeUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
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

  const tokens = generateTokens(user);
  await storeRefreshToken({ userId: user.id, jti: tokens.refreshJti });

  return {
    user: sanitizeUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

const refresh = async ({ refreshToken }) => {
  let payload;

  try {
    payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
  } catch (_e) {
    const err = new Error("Geçersiz oturum.");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }

  if (payload.type !== "refresh" || !payload.jti) {
    const err = new Error("Geçersiz token tipi.");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }

  const user = await prisma.users.findFirst({
    where: { id: payload.id, deletedat: null },
  });

  if (!user) {
    const err = new Error("Kullanıcı bulunamadı.");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }

  const active = await isRefreshTokenActive({ userId: user.id, jti: payload.jti });
  if (!active) {
    const err = new Error("Oturum sonlandırılmış veya geçersiz.");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    throw err;
  }

  await revokeRefreshToken({ userId: user.id, jti: payload.jti });

  const tokens = generateTokens(user);
  await storeRefreshToken({ userId: user.id, jti: tokens.refreshJti });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

const logout = async ({ refreshToken }) => {
  let payload;

  try {
    payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
  } catch (_e) {
    return { success: true };
  }

  if (payload.type !== "refresh" || !payload.jti || !payload.id) return { success: true };

  await revokeRefreshToken({ userId: payload.id, jti: payload.jti });
  return { success: true };
};

const forgotPassword = async (email) => {
  const user = await prisma.users.findFirst({
    where: { email, deletedat: null },
  });

  if (!user) return;

  const resetToken = jwt.sign(
    { id: user.id, type: "reset" },
    process.env.JWT_RESET_SECRET || JWT_SECRET,
    { expiresIn: process.env.JWT_RESET_EXPIRES_IN || "15m" }
  );

  if (process.env.RETURN_RESET_TOKEN === "true") {
    return { resetToken };
  }
};

const resetPassword = async ({ token, password }) => {
  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_RESET_SECRET || JWT_SECRET);
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

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword, sanitizeUser };
