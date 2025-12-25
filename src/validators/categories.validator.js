const { z } = require("zod");

const uuid = z.uuid({ message: "Geçersiz ID formatı." });

const listCategoriesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    parentid: uuid.optional(),
  }),
});

const categoryIdParamSchema = z.object({
  params: z.object({
    id: uuid,
  }),
});

const createCategorySchema = z.object({
  body: z.object({
    categoryname: z.string().trim().min(2).max(255),
    parentid: uuid.optional().nullable(),
  }),
});

const updateCategorySchema = z.object({
  params: z.object({
    id: uuid,
  }),
  body: z
    .object({
      categoryname: z.string().trim().min(2).max(255).optional(),
      parentid: uuid.optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Güncellenecek en az bir alan göndermelisin.",
    }),
});

const categoryBooksSchema = z.object({
  params: z.object({
    id: uuid,
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
  }),
});

module.exports = {
  listCategoriesSchema,
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
  categoryBooksSchema,
};
