const { z } = require("zod");

const reviewIdParamSchema = z.object({
  params: z.object({
    id: z.uuid("Geçerli bir review ID giriniz."),
  }),
});

const createReviewSchema = z.object({
  params: z.object({
    id: z.uuid("Geçerli bir kitap ID giriniz."), 
  }),
  body: z.object({
    rating: z.coerce
      .number({ invalid_type_error: "Puan sayı olmalıdır." })
      .int("Puan tam sayı olmalıdır.")
      .min(1, "Puan en az 1 olmalıdır.")
      .max(5, "Puan en fazla 5 olmalıdır."),
    comment: z
      .string()
      .trim()
      .min(1, "Yorum boş olamaz.")
      .optional(),
  }),
});

const updateReviewSchema = z.object({
  params: z.object({
    id: z.uuid("Geçerli bir review ID giriniz."),
  }),
  body: z
    .object({
      rating: z.coerce
        .number({ invalid_type_error: "Puan sayı olmalıdır." })
        .int("Puan tam sayı olmalıdır.")
        .min(1, "Puan en az 1 olmalıdır.")
        .max(5, "Puan en fazla 5 olmalıdır.")
        .optional(),
      comment: z
        .string()
        .trim()
        .min(1, "Yorum boş olamaz.")
        .nullable()
        .optional(),
    })
    .refine((obj) => Object.keys(obj).length > 0, {
      message: "Güncelleme için en az 1 alan gönderilmelidir.",
    }),
});

const getAllReviewsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1).optional(),
    limit: z.coerce.number().int().positive().max(100).default(10).optional(),
    bookId: z.uuid("Geçerli bir kitap ID giriniz.").optional(),
    userId: z.uuid("Geçerli bir kullanıcı ID giriniz.").optional(),
  }),
});

module.exports = {
  reviewIdParamSchema,
  createReviewSchema,
  updateReviewSchema,
  getAllReviewsSchema,
};