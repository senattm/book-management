const { z } = require("zod");

const borrowingIdParamSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});

const createBorrowingSchema = z.object({
  body: z.object({
    bookid: z.uuid(),
    userid: z.uuid().optional(),
    dueat: z.string().datetime().optional(),
  }),
});

const listOverdueSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }).optional(),
});

const listBorrowingsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    status: z.enum(["active", "returned"]).optional(), 
  }).optional(),
});

module.exports = {
  borrowingIdParamSchema,
  createBorrowingSchema,
  listOverdueSchema,
  listBorrowingsSchema
};
