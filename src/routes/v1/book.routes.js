/**
 * @swagger
 * /api/v1/books:
 *   get:
 *     tags:
 *       - Books
 *     summary: Kitap listesini getir
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
 *         description: Kitap adında arama
 *       - in: query
 *         name: authorid
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Yazara göre filtrele
 *       - in: query
 *         name: categoryid
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Kategoriye göre filtrele
 *     responses:
 *       200:
 *         description: Kitap listesi başarıyla getirildi
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
 * /api/v1/books/{id}:
 *   get:
 *     tags:
 *       - Books
 *     summary: ID'ye göre kitap getir
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Kitap ID
 *     responses:
 *       200:
 *         description: Kitap başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 isbn:
 *                   type: string
 *                 publishedyear:
 *                   type: integer
 *                 authorid:
 *                   type: string
 *                 categoryid:
 *                   type: string
 *                 averagerating:
 *                   type: number
 *                 reviewcount:
 *                   type: integer
 *       404:
 *         description: Kitap bulunamadı
 *       400:
 *         description: Geçersiz ID formatı
 */

/**
 * @swagger
 * /api/v1/books/{id}/reviews:
 *   get:
 *     tags:
 *       - Books
 *       - Reviews
 *     summary: Kitaba ait yorumları getir
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Kitap ID
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
 *         description: Sayfa başına yorum sayısı
 *     responses:
 *       200:
 *         description: Yorumlar başarıyla getirildi
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
 *                       rating:
 *                         type: integer
 *                       comment:
 *                         type: string
 *                       userid:
 *                         type: string
 *                       createdat:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *       404:
 *         description: Kitap bulunamadı
 */

/**
 * @swagger
 * /api/v1/books/{id}/reviews:
 *   post:
 *     tags:
 *       - Books
 *       - Reviews
 *     summary: Kitaba yorum yap
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Kitap ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: Harika bir kitap, mutlaka okuyun!
 *     responses:
 *       201:
 *         description: Yorum başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz veri
 *       401:
 *         description: Yetkisiz
 *       404:
 *         description: Kitap bulunamadı
 *       409:
 *         description: Bu kitap için zaten yorum yaptınız
 */

/**
 * @swagger
 * /api/v1/books:
 *   post:
 *     tags:
 *       - Books
 *     summary: Yeni kitap oluştur (Sadece Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - isbn
 *               - authorid
 *               - categoryid
 *             properties:
 *               title:
 *                 type: string
 *                 example: Kürk Mantolu Madonna
 *               isbn:
 *                 type: string
 *                 example: 978-9754370659
 *               publishedyear:
 *                 type: integer
 *                 example: 1943
 *               authorid:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               categoryid:
 *                 type: string
 *                 format: uuid
 *                 example: 660e8400-e29b-41d4-a716-446655440000
 *               description:
 *                 type: string
 *                 example: Türk edebiyatının önemli eserlerinden biri
 *     responses:
 *       201:
 *         description: Kitap başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz veri
 *       401:
 *         description: Yetkisiz
 *       403:
 *         description: Admin yetkisi gerekli
 *       409:
 *         description: ISBN zaten mevcut
 */

/**
 * @swagger
 * /api/v1/books/{id}:
 *   put:
 *     tags:
 *       - Books
 *     summary: Kitap bilgilerini güncelle (Sadece Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Kitap ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Kürk Mantolu Madonna
 *               isbn:
 *                 type: string
 *                 example: 978-9754370659
 *               publishedyear:
 *                 type: integer
 *                 example: 1943
 *               authorid:
 *                 type: string
 *                 format: uuid
 *               categoryid:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kitap başarıyla güncellendi
 *       400:
 *         description: Geçersiz veri veya güncellenecek alan yok
 *       401:
 *         description: Yetkisiz
 *       403:
 *         description: Admin yetkisi gerekli
 *       404:
 *         description: Kitap bulunamadı
 *       409:
 *         description: ISBN zaten kullanımda
 */

/**
 * @swagger
 * /api/v1/books/{id}:
 *   delete:
 *     tags:
 *       - Books
 *     summary: Kitap sil (Sadece Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Kitap ID
 *     responses:
 *       200:
 *         description: Kitap başarıyla silindi
 *       401:
 *         description: Yetkisiz
 *       403:
 *         description: Admin yetkisi gerekli
 *       404:
 *         description: Kitap bulunamadı
 *       409:
 *         description: Kitaba ait yorumlar var, silinemez
 */

const router = require("express").Router();
const bookController = require("../../controllers/book.controller");
const reviewController = require("../../controllers/reviews.controller");
const validate = require("../../middlewares/validate.middleware");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const {
  createBookSchema,
  listBooksSchema,
  bookIdParamSchema,
  updateBookSchema,
} = require("../../validators/book.validator");
const {
  createReviewSchema,
} = require("../../validators/reviews.validator");

router.get("/", validate(listBooksSchema), bookController.getAllBooks);
router.get("/:id", validate(bookIdParamSchema), bookController.getBookById);
router.get("/:id/reviews", validate(bookIdParamSchema), bookController.getBookReviews);
router.post(
  "/:id/reviews",
  authenticate,
  validate(createReviewSchema),
  reviewController.createReview
);

router.post("/", authenticate, authorize("admin"), validate(createBookSchema), bookController.createBook);
router.put("/:id", authenticate, authorize("admin"), validate(updateBookSchema), bookController.updateBook);
router.delete("/:id", authenticate, authorize("admin"), validate(bookIdParamSchema), bookController.deleteBook);

module.exports = router;