const { z } = require("zod");

const authorIdParamSchema = z.object({
  params: z.object({
    id: z.uuid("Geçerli bir yazar ID giriniz."),
  }),
});

const createAuthorSchema = z.object({
  body: z.object({
    fullname: z
      .string({ required_error: "Yazar adı zorunludur." })
      .trim()
      .min(2, "Yazar adı en az 2 karakter olmalıdır.")
      .max(255, "Yazar adı en fazla 255 karakter olabilir."),
    bio: z
      .string()
      .trim()
      .max(2000, "Bio en fazla 2000 karakter olabilir.")
      .optional(),
  }),
});

const updateAuthorSchema = z.object({
  params: z.object({
    id: z.uuid("Geçerli bir yazar ID giriniz."),
  }),
  body: z
    .object({
      fullname: z.string().trim().min(2).max(255).optional(),
      bio: z.string().trim().max(2000).nullable().optional(),
    })
    .refine((obj) => Object.keys(obj).length > 0, {
      message: "Güncelleme için en az 1 alan gönderilmelidir.",
    }),
});

const listAuthorsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    search: z.string().trim().optional(),
  }),
});

module.exports = {
  authorIdParamSchema,
  createAuthorSchema,
  updateAuthorSchema,
  listAuthorsSchema,
};
