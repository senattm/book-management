const { z } = require("zod");
const { registry } = require("../config/openapi");

const reviewIdParam = z.object({
  id: z.string().uuid("Geçerli bir review ID giriniz.").openapi({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }),
});

const reviewIdParamSchema = z.object({
  params: reviewIdParam,
});

const createReviewBody = z.object({
  rating: z.coerce
    .number({ invalid_type_error: "Puan sayı olmalıdır." })
    .int("Puan tam sayı olmalıdır.")
    .min(1, "Puan en az 1 olmalıdır.")
    .max(5, "Puan en fazla 5 olmalıdır.")
    .openapi({ example: 5 }),
  comment: z
    .string()
    .trim()
    .min(1, "Yorum boş olamaz.")
    .optional()
    .openapi({ example: 'Harika bir kitap!' }),
});

const createReviewSchema = z.object({
  params: z.object({
    id: z.string().uuid("Geçerli bir kitap ID giriniz."), // Book ID
  }),
  body: createReviewBody,
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/books/{id}/reviews',
  tags: ['Books', 'Reviews'],
  summary: 'Kitaba yorum yap',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Kitap ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: createReviewBody,
        },
      },
    },
  },
  responses: {
    201: { description: 'Yorum başarıyla oluşturuldu' },
    400: { description: 'Geçersiz veri' },
    401: { description: 'Yetkisiz' },
    404: { description: 'Kitap bulunamadı' },
    409: { description: 'Bu kitap için zaten yorum yaptınız' },
  },
});

const updateReviewBody = z.object({
  rating: z.coerce
    .number({ invalid_type_error: "Puan sayı olmalıdır." })
    .int("Puan tam sayı olmalıdır.")
    .min(1, "Puan en az 1 olmalıdır.")
    .max(5, "Puan en fazla 5 olmalıdır.")
    .optional()
    .openapi({ example: 4 }),
  comment: z
    .string()
    .trim()
    .min(1, "Yorum boş olamaz.")
    .nullable()
    .optional()
    .openapi({ example: 'Yorumumu güncelliyorum.' }),
}).refine((obj) => Object.keys(obj).length > 0, {
  message: "Güncelleme için en az 1 alan gönderilmelidir.",
});

const updateReviewSchema = z.object({
  params: reviewIdParam,
  body: updateReviewBody,
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/reviews/{id}',
  tags: ['Reviews'],
  summary: 'Yorumu güncelle (Sadece kendi yorumunu güncelleyebilir)',
  security: [{ bearerAuth: [] }],
  request: {
    params: reviewIdParam,
    body: {
      content: {
        'application/json': {
          schema: updateReviewBody,
        },
      },
    },
  },
  responses: {
    200: { description: 'Yorum başarıyla güncellendi' },
    400: { description: 'Geçersiz veri veya güncellenecek alan yok' },
    401: { description: 'Yetkisiz' },
    403: { description: 'Bu yorum size ait değil' },
    404: { description: 'Yorum bulunamadı' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/reviews/{id}',
  tags: ['Reviews'],
  summary: 'Yorumu sil (Sadece kendi yorumunu silebilir)',
  security: [{ bearerAuth: [] }],
  request: {
    params: reviewIdParam,
  },
  responses: {
    200: { description: 'Yorum başarıyla silindi' },
    401: { description: 'Yetkisiz' },
    403: { description: 'Bu yorum size ait değil' },
    404: { description: 'Yorum bulunamadı' },
  },
});

const getAllReviewsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1).optional(),
    limit: z.coerce.number().int().positive().max(100).default(10).optional(),
    bookId: z.string().uuid("Geçerli bir kitap ID giriniz.").optional(),
    userId: z.string().uuid("Geçerli bir kullanıcı ID giriniz.").optional(),
  }),
});

module.exports = {
  reviewIdParamSchema,
  createReviewSchema,
  updateReviewSchema,
  getAllReviewsSchema,
};