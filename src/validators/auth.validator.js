const { z } = require("zod");

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "İsim en az 2 karakter olmalı"),
    email: z.string().email("Geçersiz email formatı"),
    password: z.string()
      .min(8, "Şifre en az 8 karakter olmalı")
      .regex(/[a-z]/, "Şifre en az bir küçük harf içermelidir")
      .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir")
      .regex(/[0-9]/, "Şifre en az bir rakam içermelidir"),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Geçersiz email formatı"),
    password: z.string().min(1, "Şifre gereklidir"),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token zorunludur"),
  }),
});

const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token zorunludur"),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Geçersiz email formatı"),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token gereklidir"),
    password: z.string()
      .min(8, "Şifre en az 8 karakter olmalı")
      .regex(/[a-z]/, "Şifre en az bir küçük harf içermelidir")
      .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir")
      .regex(/[0-9]/, "Şifre en az bir rakam içermelidir"),
  }),
});


module.exports = { registerSchema, loginSchema, refreshSchema, logoutSchema, forgotPasswordSchema, resetPasswordSchema };