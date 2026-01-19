const { z } = require("zod");
const { registry } = require("../config/openapi");

const registerBody = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı").openapi({ example: 'John Doe' }),
  email: z.email("Geçersiz email formatı").openapi({ example: 'john@example.com' }),
  password: z.string()
    .min(8, "Şifre en az 8 karakter olmalı")
    .regex(/[a-z]/, "Şifre en az bir küçük harf içermelidir")
    .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir")
    .regex(/[0-9]/, "Şifre en az bir rakam içermelidir")
    .openapi({ example: 'Password123!' }),
});

registry.register('RegisterRequest', registerBody);

const registerSchema = z.object({
  body: registerBody,
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/register',
  tags: ['Auth'],
  summary: 'Yeni kullanıcı kaydı',
  request: {
    body: {
      content: {
        'application/json': {
          schema: registerBody,
        },
      },
    },
  },
  responses: {
    201: { description: 'Kullanıcı başarıyla oluşturuldu' },
    400: { description: 'Geçersiz veri' },
    409: { description: 'Kullanıcı zaten mevcut' },
  },
});

const loginBody = z.object({
  email: z.email("Geçersiz email formatı").openapi({ example: 'john@example.com' }),
  password: z.string().min(8, "Şifre gereklidir").openapi({ example: 'Password123!' }),
});

registry.register('LoginRequest', loginBody);

const loginSchema = z.object({
  body: loginBody,
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  tags: ['Auth'],
  summary: 'Kullanıcı girişi',
  request: {
    body: {
      content: {
        'application/json': {
          schema: loginBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Başarılı giriş',
      content: {
        'application/json': {
          schema: z.object({
            accessToken: z.string(),
            refreshToken: z.string(),
          }),
        },
      },
    },
    401: { description: 'Geçersiz kimlik bilgileri' },
    429: { description: 'Çok fazla deneme' },
  },
});

const refreshBody = z.object({
  refreshToken: z.string().min(1, "Refresh token zorunludur").openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
});

registry.register('RefreshRequest', refreshBody);

const refreshSchema = z.object({
  body: refreshBody,
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/refresh',
  tags: ['Auth'],
  summary: 'Token yenileme',
  request: {
    body: {
      content: {
        'application/json': {
          schema: refreshBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Token başarıyla yenilendi',
      content: {
        'application/json': {
          schema: z.object({
            accessToken: z.string(),
            refreshToken: z.string(),
          }),
        },
      },
    },
    401: { description: 'Geçersiz refresh token' },
  },
});

const logoutBody = z.object({
  refreshToken: z.string().min(1, "Refresh token zorunludur").openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
});

const logoutSchema = z.object({
  body: logoutBody,
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/logout',
  tags: ['Auth'],
  summary: 'Kullanıcı çıkışı',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: logoutBody,
        },
      },
    },
  },
  responses: {
    200: { description: 'Başarılı çıkış' },
    401: { description: 'Yetkisiz' },
  },
});

const forgotPasswordBody = z.object({
  email: z.email("Geçersiz email formatı").openapi({ example: 'john@example.com' }),
});

const forgotPasswordSchema = z.object({
  body: forgotPasswordBody,
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/forgot-password',
  tags: ['Auth'],
  summary: 'Şifre sıfırlama isteği',
  request: {
    body: {
      content: {
        'application/json': {
          schema: forgotPasswordBody,
        },
      },
    },
  },
  responses: {
    200: { description: 'Sıfırlama emaili gönderildi' },
    404: { description: 'Kullanıcı bulunamadı' },
    429: { description: 'Çok fazla deneme' },
  },
});

const resetPasswordBody = z.object({
  token: z.string().min(1, "Token gereklidir").openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
  password: z.string()
    .min(8, "Şifre en az 8 karakter olmalı")
    .regex(/[a-z]/, "Şifre en az bir küçük harf içermelidir")
    .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir")
    .regex(/[0-9]/, "Şifre en az bir rakam içermelidir")
    .openapi({ example: 'NewPassword123!' }),
});

const resetPasswordSchema = z.object({
  body: resetPasswordBody,
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/reset-password',
  tags: ['Auth'],
  summary: 'Şifre sıfırlama',
  request: {
    body: {
      content: {
        'application/json': {
          schema: resetPasswordBody,
        },
      },
    },
  },
  responses: {
    200: { description: 'Şifre başarıyla sıfırlandı' },
    400: { description: 'Geçersiz token veya şifre' },
    429: { description: 'Çok fazla deneme' },
  },
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};