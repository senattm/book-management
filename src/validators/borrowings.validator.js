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

module.exports = {
  borrowingIdParamSchema,
  createBorrowingSchema,
  listOverdueSchema,
};
