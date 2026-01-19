const { z } = require("zod");
const { registry } = require("../config/openapi");

const borrowingIdParam = z.object({
  id: z.string().uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Ödünç alma kayıt ID' }),
});

const borrowingIdParamSchema = z.object({
  params: borrowingIdParam,
});

const createBorrowingBody = z.object({
  bookid: z.string().uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
  userid: z.string().uuid().optional().openapi({ description: '(Opsiyonel) Admin başkası adına alıyorsa' }),
  dueat: z.string().datetime().optional().openapi({ description: 'İade tarihi (belirtilmezse otomatik 14 gün)' }),
});

const createBorrowingSchema = z.object({
  body: createBorrowingBody,
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/borrowings',
  tags: ['Borrowings'],
  summary: 'Yeni kitap ödünç al',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createBorrowingBody,
        },
      },
    },
  },
  responses: {
    201: { description: 'Kitap başarıyla ödünç alındı' },
    400: { description: 'Geçersiz veri' },
    401: { description: 'Yetkisiz' },
    404: { description: 'Kitap bulunamadı' },
    409: { description: 'Kitap zaten ödünç alınmış veya kullanıcının iade etmediği kitaplar var' },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/borrowings/{id}/return',
  tags: ['Borrowings'],
  summary: 'Ödünç alınan kitabı iade et',
  security: [{ bearerAuth: [] }],
  request: {
    params: borrowingIdParam,
  },
  responses: {
    200: { description: 'Kitap başarıyla iade edildi' },
    400: { description: 'Geçersiz ID formatı' },
    401: { description: 'Yetkisiz' },
    403: { description: 'Bu ödünç alma kaydı size ait değil' },
    404: { description: 'Ödünç alma kaydı bulunamadı' },
    409: { description: 'Kitap zaten iade edilmiş' },
  },
});

const listOverdueQuery = z.object({
  page: z.string().optional().openapi({ example: '1' }),
  limit: z.string().optional().openapi({ example: '10' }),
});

const listOverdueSchema = z.object({
  query: listOverdueQuery.optional(),
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/borrowings/overdue',
  tags: ['Borrowings'],
  summary: 'Gecikmiş ödünç almaları listele (Kullanıcı kendi kayıtlarını görür)',
  security: [{ bearerAuth: [] }],
  request: {
    query: listOverdueQuery,
  },
  responses: {
    200: {
      description: 'Gecikmiş ödünç alma listesi başarıyla getirildi',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(z.object({})),
            pagination: z.object({}),
          }),
        },
      },
    },
    401: { description: 'Yetkisiz' },
  },
});

const listBorrowingsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1).optional().openapi({ example: 1 }),
  limit: z.coerce.number().int().min(1).max(100).default(10).optional().openapi({ example: 10 }),
  status: z.enum(["active", "returned"]).optional().openapi({ description: 'active => returnedat null, returned => returnedat dolu' }),
  userid: z.string().uuid().optional().openapi({ description: '(Sadece Admin) Belirli bir kullanıcının ödünç kayıtları' }),
});

const listBorrowingsSchema = z.object({
  query: listBorrowingsQuery.optional(),
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/borrowings',
  tags: ['Borrowings'],
  summary: 'Ödünç kayıtlarını listele',
  description: 'User kendi kayıtlarını görür, Admin kullanıcıya göre filtreleyebilir',
  security: [{ bearerAuth: [] }],
  request: {
    query: listBorrowingsQuery,
  },
  responses: {
    200: { description: 'Ödünç listesi' },
    401: { description: 'Yetkisiz' },
  },
});


module.exports = {
  borrowingIdParamSchema,
  createBorrowingSchema,
  listOverdueSchema,
  listBorrowingsSchema
};
