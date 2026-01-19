const { z } = require("zod");
const { registry } = require("../config/openapi");

const userIdParam = z.object({
  id: z.string().uuid("Geçersiz user id").openapi({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }),
});

const userIdParamSchema = z.object({
  params: userIdParam,
});

const listUsersQuery = z.object({
  page: z.string().optional().openapi({ example: '1' }),
  limit: z.string().optional().openapi({ example: '10' }),
  search: z.string().optional().openapi({ description: 'Kullanıcı adı veya email\'de arama' }),
  role: z.enum(["admin", "user"]).optional().openapi({ description: 'Role göre filtrele' }),
});

const listUsersSchema = z.object({
  query: listUsersQuery,
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/users',
  tags: ['Users'],
  summary: 'Tüm kullanıcıları listele (Sadece Admin)',
  security: [{ bearerAuth: [] }],
  request: {
    query: listUsersQuery,
  },
  responses: {
    200: {
      description: 'Kullanıcı listesi başarıyla getirildi',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(z.object({})),
            pagination: z.object({}),
          }),
        },
      },
    },
    401: { description: 'Yetkisiz' },
    403: { description: 'Admin yetkisi gerekli' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/users/me',
  tags: ['Users'],
  summary: 'Kendi profil bilgilerini getir',
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Profil bilgileri başarıyla getirildi' },
    401: { description: 'Yetkisiz' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/users/{id}',
  tags: ['Users'],
  summary: "ID'ye göre kullanıcı getir (Sadece Admin)",
  security: [{ bearerAuth: [] }],
  request: {
    params: userIdParam,
  },
  responses: {
    200: { description: 'Kullanıcı başarıyla getirildi' },
    401: { description: 'Yetkisiz' },
    403: { description: 'Admin yetkisi gerekli' },
    404: { description: 'Kullanıcı bulunamadı' },
  },
});

const updateUserBody = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı").optional().openapi({ example: 'Yeni İsim' }),
  email: z.string().email("Geçersiz email").optional().openapi({ example: 'newemail@example.com' }),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı").optional().openapi({ example: 'NewPassword123!' }),
  avatar: z.string().optional().openapi({ example: 'https://example.com/avatar.jpg' }),
}).refine((data) => Object.keys(data).length > 0, {
  message: "Güncelleme için en az bir alan gönderilmelidir.",
});

const updateUserSchema = z.object({
  params: userIdParam,
  body: updateUserBody,
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/users/{id}',
  tags: ['Users'],
  summary: 'Kullanıcı bilgilerini güncelle (Kullanıcı kendisini, admin herkesi güncelleyebilir)',
  security: [{ bearerAuth: [] }],
  request: {
    params: userIdParam,
    body: {
      content: {
        'application/json': {
          schema: updateUserBody,
        },
      },
    },
  },
  responses: {
    200: { description: 'Kullanıcı başarıyla güncellendi' },
    400: { description: 'Geçersiz veri veya güncellenecek alan yok' },
    401: { description: 'Yetkisiz' },
    403: { description: 'Bu kullanıcıyı güncelleme yetkiniz yok veya admin sadece admin tarafından güncellenebilir' },
    404: { description: 'Kullanıcı bulunamadı' },
    409: { description: 'Email zaten kullanımda' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/users/{id}',
  tags: ['Users'],
  summary: 'Kullanıcı sil (Sadece Admin)',
  security: [{ bearerAuth: [] }],
  request: {
    params: userIdParam,
  },
  responses: {
    200: { description: 'Kullanıcı başarıyla silindi' },
    401: { description: 'Yetkisiz' },
    403: { description: 'Admin yetkisi gerekli' },
    404: { description: 'Kullanıcı bulunamadı' },
    409: { description: 'Kullanıcının aktif ödünç almaları var, silinemez' },
  },
});


const borrowingsQuery = z.object({
  page: z.string().optional().openapi({ example: '1' }),
  limit: z.string().optional().openapi({ example: '10' }),
  status: z.enum(["active", "returned", "overdue"]).optional().openapi({ description: 'Ödünç alma durumuna göre filtrele' }),
});

const borrowingsQuerySchema = z.object({
  params: userIdParam,
  query: borrowingsQuery,
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/users/{id}/borrowings',
  tags: ['Users'],
  summary: 'Kullanıcının ödünç alma geçmişini getir (Kullanıcı sadece kendisini, admin herkesi görebilir)',
  security: [{ bearerAuth: [] }],
  request: {
    params: userIdParam,
    query: borrowingsQuery,
  },
  responses: {
    200: { description: 'Ödünç alma geçmişi başarıyla getirildi' },
    401: { description: 'Yetkisiz' },
    403: { description: 'Bu kullanıcının kayıtlarını görme yetkiniz yok' },
    404: { description: 'Kullanıcı bulunamadı' },
  },
});

module.exports = {
  userIdParamSchema,
  listUsersSchema,
  updateUserSchema,
  borrowingsQuerySchema
};
