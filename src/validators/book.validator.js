const { z } = require("zod");

const createBookSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: "Kitap başlığı zorunludur." })
      .trim()
      .min(1, "Kitap başlığı en az 1 karakter olmalıdır.")
      .max(255, "Kitap başlığı en fazla 255 karakter olabilir."),

    isbn: z
      .string({ required_error: "ISBN alanı zorunludur." })
      .trim()
      .regex(/^[\d-]{10,17}$/, "Geçersiz ISBN formatı."),

    authorid: z
      .string({ required_error: "Yazar ID zorunludur." })
      .uuid("Geçerli bir yazar ID giriniz."),

    categoryid: z
      .string({ required_error: "Kategori ID zorunludur." })
      .uuid("Geçerli bir kategori ID giriniz."),

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
      .min(0, "Stok miktarı negatif olamaz.")
      .default(0),
  }),
});

module.exports = { createBookSchema };
