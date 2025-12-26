/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Kategori listesini getir
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Sayfa numarası
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Sayfa başına kayıt sayısı
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Kategori adında arama
 *       - in: query
 *         name: parentid
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Alt kategorileri getirmek için parent ID
 *     responses:
 *       200:
 *         description: Kategori listesi başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *       400:
 *         description: Geçersiz parametreler
 */

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     tags:
 *       - Categories
 *     summary: ID'ye göre kategori getir
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Kategori ID
 *     responses:
 *       200:
 *         description: Kategori başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 categoryname:
 *                   type: string
 *                 parentid:
 *                   type: string
 *                   nullable: true
 *                 createdat:
 *                   type: string
 *                   format: date-time
 *                 updatedat:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Kategori bulunamadı
 *       400:
 *         description: Geçersiz ID formatı
 */

/**
 * @swagger
 * /api/v1/categories/{id}/books:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Kategoriye ait kitapları getir
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Kategori ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Sayfa numarası
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Sayfa başına kitap sayısı
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Kitap adında arama
 *     responses:
 *       200:
 *         description: Kategoriye ait kitaplar başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       isbn:
 *                         type: string
 *                       publishedyear:
 *                         type: integer
 *                       authorid:
 *                         type: string
 *                 pagination:
 *                   type: object
 *       404:
 *         description: Kategori bulunamadı
 */

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     tags:
 *       - Categories
 *     summary: Yeni kategori oluştur (Sadece Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryname
 *             properties:
 *               categoryname:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *                 example: Roman
 *               parentid:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *                 description: Üst kategori ID (alt kategori oluşturmak için)
 *     responses:
 *       201:
 *         description: Kategori başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz veri veya kategori kendisini parent olarak alamaz
 *       401:
 *         description: Yetkisiz
 *       403:
 *         description: Admin yetkisi gerekli
 *       404:
 *         description: Parent kategori bulunamadı
 *       409:
 *         description: Kategori zaten mevcut
 */

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   put:
 *     tags:
 *       - Categories
 *     summary: Kategori bilgilerini güncelle (Sadece Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Kategori ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryname:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *                 example: Bilim Kurgu
 *               parentid:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Kategori başarıyla güncellendi
 *       400:
 *         description: Geçersiz veri, güncellenecek alan yok veya kategori kendisini parent olarak alamaz
 *       401:
 *         description: Yetkisiz
 *       403:
 *         description: Admin yetkisi gerekli
 *       404:
 *         description: Kategori veya parent kategori bulunamadı
 *       409:
 *         description: Kategori adı zaten kullanımda
 */

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   delete:
 *     tags:
 *       - Categories
 *     summary: Kategori sil (Sadece Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Kategori ID
 *     responses:
 *       200:
 *         description: Kategori başarıyla silindi
 *       401:
 *         description: Yetkisiz
 *       403:
 *         description: Admin yetkisi gerekli
 *       404:
 *         description: Kategori bulunamadı
 *       409:
 *         description: Kategoriye ait kitaplar veya alt kategoriler var, silinemez
 */

const router = require("express").Router();
const categoryController = require("../../controllers/categories.controller");
const validate = require("../../middlewares/validate.middleware");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");

const {
  listCategoriesSchema,
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
  categoryBooksSchema,
} = require("../../validators/categories.validator");

router.get("/", validate(listCategoriesSchema), categoryController.listCategories);
router.get("/:id", validate(categoryIdParamSchema), categoryController.getCategoryById);
router.get("/:id/books", validate(categoryBooksSchema), categoryController.getCategoryBooks);

router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(createCategorySchema),
  categoryController.createCategory
);

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(updateCategorySchema),
  categoryController.updateCategory
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(categoryIdParamSchema),
  categoryController.deleteCategory
);

module.exports = router;