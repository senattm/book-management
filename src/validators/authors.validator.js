const { z } = require("zod");
const { registry } = require("../config/openapi");

const authorIdParam = z.object({
  id: z.string().uuid("Geçerli bir yazar ID giriniz.").openapi({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }),
});

const authorIdParamSchema = z.object({
  params: authorIdParam,
});

const createAuthorBody = z.object({
  fullname: z
    .string({ required_error: "Yazar adı zorunludur." })
    .trim()
    .min(2, "Yazar adı en az 2 karakter olmalıdır.")
    .max(255, "Yazar adı en fazla 255 karakter olabilir.")
    .openapi({ example: 'Orhan Pamuk' }),
  bio: z
    .string()
    .trim()
    .max(2000, "Bio en fazla 2000 karakter olabilir.")
    .optional()
    .openapi({ example: 'Nobel ödüllü Türk yazar' }),
});

const createAuthorSchema = z.object({
  body: createAuthorBody,
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/authors',
  tags: ['Authors'],
  summary: 'Yeni yazar oluştur (Sadece Admin)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createAuthorBody,
        },
      },
    },
  },
  responses: {
    201: { description: 'Yazar başarıyla oluşturuldu' },
    400: { description: 'Geçersiz veri' },
    401: { description: 'Yetkisiz' },
    403: { description: 'Admin yetkisi gerekli' },
    409: { description: 'Yazar zaten mevcut' },
  },
});

const updateAuthorBody = z.object({
  fullname: z.string().trim().min(2).max(255).optional().openapi({ example: 'Orhan Pamuk' }),
  bio: z.string().trim().max(2000).nullable().optional().openapi({ example: 'Güncellenmiş biyografi' }),
}).refine((obj) => Object.keys(obj).length > 0, {
  message: "Güncelleme için en az 1 alan gönderilmelidir.",
});

const updateAuthorSchema = z.object({
  params: authorIdParam,
  body: updateAuthorBody,
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/authors/{id}',
  tags: ['Authors'],
  summary: 'Yazar bilgilerini güncelle (Sadece Admin)',
  security: [{ bearerAuth: [] }],
  request: {
    params: authorIdParam,
    body: {
      content: {
        'application/json': {
          schema: updateAuthorBody,
        },
      },
    },
  },
  responses: {
    200: { description: 'Yazar başarıyla güncellendi' },
    400: { description: 'Geçersiz veri veya güncellenecek alan yok' },
    401: { description: 'Yetkisiz' },
    403: { description: 'Admin yetkisi gerekli' },
    404: { description: 'Yazar bulunamadı' },
  },
});

const listAuthorsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1).optional().openapi({ example: 1, description: 'Sayfa numarası' }),
  limit: z.coerce.number().int().min(1).max(100).default(10).optional().openapi({ example: 10, description: 'Sayfa başına kayıt sayısı' }),
  search: z.string().trim().optional().openapi({ description: 'Yazar adında arama' }),
});

const listAuthorsSchema = z.object({
  query: listAuthorsQuery,
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/authors',
  tags: ['Authors'],
  summary: 'Yazar listesini getir',
  request: {
    query: listAuthorsQuery,
  },
  responses: {
    200: {
      description: 'Yazar listesi başarıyla getirildi',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(z.object({})),
            pagination: z.object({}),
          }),
        },
      },
    },
    400: { description: 'Geçersiz parametreler' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/authors/{id}',
  tags: ['Authors'],
  summary: "ID'ye göre yazar getir",
  request: {
    params: authorIdParam,
  },
  responses: {
    200: { description: 'Yazar başarıyla getirildi' },
    404: { description: 'Yazar bulunamadı' },
    400: { description: 'Geçersiz ID formatı' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/authors/{id}',
  tags: ['Authors'],
  summary: 'Yazar sil (Sadece Admin)',
  security: [{ bearerAuth: [] }],
  request: {
    params: authorIdParam,
  },
  responses: {
    200: { description: 'Yazar başarıyla silindi' },
    401: { description: 'Yetkisiz' },
    403: { description: 'Admin yetkisi gerekli' },
    404: { description: 'Yazar bulunamadı' },
    409: { description: 'Yazara ait kitaplar var, silinemez' },
  },
});

const listAuthorBooksQuery = z.object({
  page: z.coerce.number().int().min(1).default(1).optional().openapi({ example: 1, description: 'Sayfa numarası' }),
  limit: z.coerce.number().int().min(1).max(100).default(10).optional().openapi({ example: 10, description: 'Sayfa başına kayıt sayısı' }),
});

const listAuthorBooksSchema = z.object({
  params: authorIdParam,
  query: listAuthorBooksQuery,
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/authors/{id}/books',
  tags: ['Authors'],
  summary: 'Yazara ait kitapları listele',
  request: {
    params: authorIdParam,
    query: listAuthorBooksQuery,
  },
  responses: {
    200: { description: 'Yazarın kitapları başarıyla getirildi' },
    400: { description: 'Geçersiz parametreler (örn. UUID formatı hatalı)' },
    404: { description: 'Yazar bulunamadı' },
  },
});

module.exports = {
  authorIdParamSchema,
  createAuthorSchema,
  updateAuthorSchema,
  listAuthorsSchema,
  listAuthorBooksSchema
};
