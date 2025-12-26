const { z } = require("zod");

const userIdParamSchema = z.object({
  params: z.object({
    id: z.uuid("Geçersiz user id"),
  }),
});

const listUsersSchema = z.object({
  query: z.object({
    page: z.string().optional(),   
    limit: z.string().optional(),
    search: z.string().optional(),
    role: z.enum(["admin", "user"]).optional(),
  }),
});

const updateUserSchema = z.object({
  params: z.object({
    id: z.uuid("Geçersiz user id"),
  }),
  body: z
    .object({
      name: z.string().min(2, "İsim en az 2 karakter olmalı").optional(),
      email: z.string().email("Geçersiz email").optional(),
      password: z.string().min(6, "Şifre en az 6 karakter olmalı").optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Güncelleme için en az bir alan gönderilmelidir.",
    }),
});

const borrowingsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(["active", "returned"]).optional(),
  }),
});

module.exports = {
  userIdParamSchema,
  listUsersSchema,
  updateUserSchema,
  borrowingsQuerySchema
};
