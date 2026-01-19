const { z } = require("zod");
const { registry } = require("../config/openapi");

const createBookBody = z.object({
  title: z
    .string({ required_error: "Kitap başlığı zorunludur." })
    .trim()
    .min(1, "Kitap başlığı en az 1 karakter olmalıdır.")
    .max(255)
    .openapi({ example: 'Kürk Mantolu Madonna' }),

  isbn: z
    .string({ required_error: "ISBN alanı zorunludur." })
    .trim()
    .regex(
      /^[\d-]{10,17}$/,
      "Geçersiz ISBN formatı (10-17 karakter, rakam ve tire)."
    )
    .openapi({ example: '978-9754370659' }),

  authorid: z.string().uuid("Geçerli bir yazar ID giriniz.").openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
  categoryid: z.string().uuid("Geçerli bir kategori ID giriniz.").openapi({ example: '660e8400-e29b-41d4-a716-446655440000' }),

  description: z
    .string()
    .trim()
    .max(2000, "Açıklama en fazla 2000 karakter olabilir.")
    .optional()
    .openapi({ example: 'Türk edebiyatının önemli eserlerinden biri' }),

  publishedat: z.coerce
    .date()
    .max(new Date(), "Yayın tarihi gelecek bir zaman olamaz.")
    .optional()
    .openapi({ example: '1943' }), // Note: Zod date expects date object or string parsable to date

  stock: z.coerce
    .number()
    .int("Stok tam sayı olmalı.")
    .min(0, "Stok negatif olamaz.")
    .default(0)
    .openapi({ example: 10 }),
});

const createBookSchema = z.object({
  body: createBookBody,
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/books',
  tags: ['Books'],
  summary: 'Yeni kitap oluştur (Sadece Admin)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createBookBody,
        },
      },
    },
  },
  responses: {
    201: { description: 'Kitap başarıyla oluşturuldu' },
    400: { description: 'Geçersiz veri' },
    401: { description: 'Yetkisiz' },
    403: { description: 'Admin yetkisi gerekli' },
    409: { description: 'ISBN zaten mevcut' },
  },
});

const listBooksQuery = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({ example: 1, description: 'Sayfa numarası' }),
  limit: z.coerce.number().int().min(1).max(100).default(10).openapi({ example: 10, description: 'Sayfa başına kayıt sayısı' }),
  search: z.string().trim().optional().openapi({ description: 'Kitap adında arama' }),
  authorid: z.string().uuid().optional().openapi({ description: 'Yazara göre filtrele' }),
  categoryid: z.string().uuid().optional().openapi({ description: 'Kategoriye göre filtrele' }),
});

const listBooksSchema = z.object({
  query: listBooksQuery,
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/books',
  tags: ['Books'],
  summary: 'Kitap listesini getir',
  request: {
    query: listBooksQuery,
  },
  responses: {
    200: {
      description: 'Kitap listesi başarıyla getirildi',
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

const bookIdParam = z.object({
  id: z.string().uuid("Geçerli bir kitap ID giriniz.").openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
});

const bookIdParamSchema = z.object({
  params: bookIdParam,
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/books/{id}',
  tags: ['Books'],
  summary: "ID'ye göre kitap getir",
  request: {
    params: bookIdParam,
  },
  responses: {
    200: { description: 'Kitap başarıyla getirildi' },
    404: { description: 'Kitap bulunamadı' },
    400: { description: 'Geçersiz ID formatı' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/books/{id}/reviews',
  tags: ['Books', 'Reviews'],
  summary: 'Kitaba ait yorumları getir',
  request: {
    params: bookIdParam,
    query: z.object({
      page: z.number().int().default(1).openapi({ example: 1 }),
      limit: z.number().int().default(10).openapi({ example: 10 }),
    }), // Defining query inline as it wasn't in listBooksSchema exactly like this, or I can allow loose schema.
    // Wait, the reviewController uses `bookIdParamSchema` which ONLY validates params. 
    // Validation for query params might be missing in the actual route handler or handled inside controller manually?
    // Checking route: `router.get("/:id/reviews", validate(bookIdParamSchema), ...)`
    // So ONLY `id` is validated by middleware. `page` and `limit` are likely handled in controller without Zod validation middleware.
    // I should stick to what `bookIdParamSchema` validates.
    // BUT for documentation purposes, I should document the query params if the controller accepts them. 
    // I will add them to the openapi definition manually here even if middleware doesn't validate them strictly yet.
  },
  responses: {
    200: { description: 'Yorumlar başarıyla getirildi' },
    404: { description: 'Kitap bulunamadı' },
  },
});

const updateBookBody = z.object({
  title: z.string().trim().min(1).max(255).optional().openapi({ example: 'Kürk Mantolu Madonna' }),
  isbn: z
    .string()
    .trim()
    .regex(/^[\d-]{10,17}$/)
    .optional()
    .openapi({ example: '978-9754370659' }),
  authorid: z.string().uuid().optional(),
  categoryid: z.string().uuid().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  publishedat: z.coerce.date().max(new Date()).nullable().optional(),
  stock: z.coerce.number().int().min(0).optional(),
}).refine((obj) => Object.keys(obj).length > 0, {
  message: "Güncelleme için en az 1 alan göndermelidir.",
});

const updateBookSchema = z.object({
  params: bookIdParam,
  body: updateBookBody,
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/books/{id}',
  tags: ['Books'],
  summary: 'Kitap bilgilerini güncelle (Sadece Admin)',
  security: [{ bearerAuth: [] }],
  request: {
    params: bookIdParam,
    body: {
      content: {
        'application/json': {
          schema: updateBookBody,
        },
      },
    },
  },
  responses: {
    200: { description: 'Kitap başarıyla güncellendi' },
    400: { description: 'Geçersiz veri veya güncellenecek alan yok' },
    401: { description: 'Yetkisiz' },
    403: { description: 'Admin yetkisi gerekli' },
    404: { description: 'Kitap bulunamadı' },
    409: { description: 'ISBN zaten kullanımda' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/books/{id}',
  tags: ['Books'],
  summary: 'Kitap sil (Sadece Admin)',
  security: [{ bearerAuth: [] }],
  request: {
    params: bookIdParam,
  },
  responses: {
    200: { description: 'Kitap başarıyla silindi' },
    401: { description: 'Yetkisiz' },
    403: { description: 'Admin yetkisi gerekli' },
    404: { description: 'Kitap bulunamadı' },
    409: { description: 'Kitaba ait yorumlar var, silinemez' },
  },
});

module.exports = {
  createBookSchema,
  listBooksSchema,
  bookIdParamSchema,
  updateBookSchema,
};
