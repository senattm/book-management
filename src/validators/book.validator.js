const { z } = require("zod");

const createBookSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: "Kitap başlığı zorunludur." })
      .trim()
      .min(1, "Kitap başlığı en az 1 karakter olmalıdır.")
      .max(255),

    isbn: z
      .string({ required_error: "ISBN alanı zorunludur." })
      .trim()
      .regex(
        /^[\d-]{10,17}$/,
        "Geçersiz ISBN formatı (10-17 karakter, rakam ve tire)."
      ),

   authorid: z.uuid("Geçerli bir yazar ID giriniz."),
  categoryid: z.uuid("Geçerli bir kategori ID giriniz."),

    description: z
      .string()
      .trim()
      .max(2000, "Açıklama en fazla 2000 karakter olabilir.")
      .optional(),

    publishedat: z.coerce
      .date()
      .max(new Date(), "Yayın tarihi gelecek bir zaman olamaz.")
      .optional(),

    stock: z.coerce
      .number()
      .int("Stok tam sayı olmalı.")
      .min(0, "Stok negatif olamaz.")
      .default(0),
  }),
});

const listBooksSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    authorid: z.uuid().optional(),
    categoryid: z.uuid().optional(),
  }),
});



const bookIdParamSchema = z.object({
  params: z.object({
    id: z.uuid("Geçerli bir kitap ID giriniz."),
  }),
});

const updateBookSchema = z.object({
  params: z.object({
    id: z.uuid("Geçerli bir kitap ID giriniz."),
  }),
  body: z
    .object({
      title: z.string().trim().min(1).max(255).optional(),
      isbn: z
        .string()
        .trim()
        .regex(/^[\d-]{10,17}$/)
        .optional(),
      authorid: z.uuid().optional(),
      categoryid: z.uuid().optional(),
      description: z.string().trim().max(2000).nullable().optional(),
      publishedat: z.coerce.date().max(new Date()).nullable().optional(),
      stock: z.coerce.number().int().min(0).optional(),
    })
    .refine((obj) => Object.keys(obj).length > 0, {
      message: "Güncelleme için en az 1 alan göndermelidir.",
    }),
});

module.exports = {
  createBookSchema,
  listBooksSchema,
  bookIdParamSchema,
  updateBookSchema,
};
