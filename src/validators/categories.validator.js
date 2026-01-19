const { z } = require("zod");
const { registry } = require("../config/openapi");

const uuid = z.string().uuid({ message: "Geçersiz ID formatı." }).openapi({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' });

const listCategoriesQuery = z.object({
  page: z.string().optional().openapi({ example: '1', description: 'Sayfa numarası' }),
  limit: z.string().optional().openapi({ example: '10', description: 'Sayfa başına kayıt sayısı' }),
  search: z.string().optional().openapi({ description: 'Kategori adında arama' }),
  parentid: uuid.optional().openapi({ description: 'Alt kategorileri getirmek için parent ID' }),
});

const listCategoriesSchema = z.object({
  query: listCategoriesQuery,
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/categories',
  tags: ['Categories'],
  summary: 'Kategori listesini getir',
  request: {
    query: listCategoriesQuery,
  },
  responses: {
    200: {
      description: 'Kategori listesi başarıyla getirildi',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(z.object({})),
            pagination: z.object({}),
          }),
        },
      },
    },
    400: { description: 'Geçersiz parametreler' },
  },
});

const categoryIdParam = z.object({
  id: uuid,
});

const categoryIdParamSchema = z.object({
  params: categoryIdParam,
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/categories/{id}',
  tags: ['Categories'],
  summary: "ID'ye göre kategori getir",
  request: {
    params: categoryIdParam,
  },
  responses: {
    200: { description: 'Kategori başarıyla getirildi' },
    404: { description: 'Kategori bulunamadı' },
    400: { description: 'Geçersiz ID formatı' },
  },
});

const createCategoryBody = z.object({
  categoryname: z.string().trim().min(2).max(255).openapi({ example: 'Roman' }),
  parentid: uuid.optional().nullable().openapi({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Üst kategori ID (alt kategori oluşturmak için)' }),
});

const createCategorySchema = z.object({
  body: createCategoryBody,
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/categories',
  tags: ['Categories'],
  summary: 'Yeni kategori oluştur (Sadece Admin)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createCategoryBody,
        },
      },
    },
  },
  responses: {
    201: { description: 'Kategori başarıyla oluşturuldu' },
    400: { description: 'Geçersiz veri veya kategori kendisini parent olarak alamaz' },
    401: { description: 'Yetkisiz' },
    403: { description: 'Admin yetkisi gerekli' },
    404: { description: 'Parent kategori bulunamadı' },
    409: { description: 'Kategori zaten mevcut' },
  },
});

const updateCategoryBody = z.object({
  categoryname: z.string().trim().min(2).max(255).optional().openapi({ example: 'Bilim Kurgu' }),
  parentid: uuid.optional().nullable().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
}).refine((data) => Object.keys(data).length > 0, {
  message: "Güncellenecek en az bir alan göndermelisin.",
});

const updateCategorySchema = z.object({
  params: categoryIdParam,
  body: updateCategoryBody,
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/categories/{id}',
  tags: ['Categories'],
  summary: 'Kategori bilgilerini güncelle (Sadece Admin)',
  security: [{ bearerAuth: [] }],
  request: {
    params: categoryIdParam,
    body: {
      content: {
        'application/json': {
          schema: updateCategoryBody,
        },
      },
    },
  },
  responses: {
    200: { description: 'Kategori başarıyla güncellendi' },
    400: { description: 'Geçersiz veri, güncellenecek alan yok veya kategori kendisini parent olarak alamaz' },
    401: { description: 'Yetkisiz' },
    403: { description: 'Admin yetkisi gerekli' },
    404: { description: 'Kategori veya parent kategori bulunamadı' },
    409: { description: 'Kategori adı zaten kullanımda' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/categories/{id}',
  tags: ['Categories'],
  summary: 'Kategori sil (Sadece Admin)',
  security: [{ bearerAuth: [] }],
  request: {
    params: categoryIdParam,
  },
  responses: {
    200: { description: 'Kategori başarıyla silindi' },
    401: { description: 'Yetkisiz' },
    403: { description: 'Admin yetkisi gerekli' },
    404: { description: 'Kategori bulunamadı' },
    409: { description: 'Kategoriye ait kitaplar veya alt kategoriler var, silinemez' },
  },
});

const categoryBooksQuery = z.object({
  page: z.string().optional().openapi({ example: '1', description: 'Sayfa numarası' }),
  limit: z.string().optional().openapi({ example: '10', description: 'Sayfa başına kitap sayısı' }),
  search: z.string().optional().openapi({ description: 'Kitap adında arama' }),
});

const categoryBooksSchema = z.object({
  params: categoryIdParam,
  query: categoryBooksQuery,
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/categories/{id}/books',
  tags: ['Categories'],
  summary: 'Kategoriye ait kitapları getir',
  request: {
    params: categoryIdParam, // In JSDoc it was 'id', which corresponds to categoryIdParam
    query: categoryBooksQuery,
  },
  responses: {
    200: { description: 'Kategoriye ait kitaplar başarıyla getirildi' },
    404: { description: 'Kategori bulunamadı' },
  },
});

module.exports = {
  listCategoriesSchema,
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
  categoryBooksSchema,
};
