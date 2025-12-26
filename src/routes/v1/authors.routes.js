/**
 * @swagger
 * /api/v1/authors:
 *   get:
 *     tags:
 *       - Authors
 *     summary: Yazar listesini getir
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
 *         description: Yazar adında arama
 *     responses:
 *       200:
 *         description: Yazar listesi başarıyla getirildi
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
 * /api/v1/authors/{id}:
 *   get:
 *     tags:
 *       - Authors
 *     summary: ID'ye göre yazar getir
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Yazar ID
 *     responses:
 *       200:
 *         description: Yazar başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 biography:
 *                   type: string
 *                 createdat:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Yazar bulunamadı
 *       400:
 *         description: Geçersiz ID formatı
 */

/**
 * @swagger
 * /api/v1/authors:
 *   post:
 *     tags:
 *       - Authors
 *     summary: Yeni yazar oluştur (Sadece Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Orhan Pamuk
 *               biography:
 *                 type: string
 *                 example: Nobel ödüllü Türk yazar
 *               birthdate:
 *                 type: string
 *                 format: date
 *                 example: 1952-06-07
 *     responses:
 *       201:
 *         description: Yazar başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz veri
 *       401:
 *         description: Yetkisiz
 *       403:
 *         description: Admin yetkisi gerekli
 *       409:
 *         description: Yazar zaten mevcut
 */

/**
 * @swagger
 * /api/v1/authors/{id}:
 *   put:
 *     tags:
 *       - Authors
 *     summary: Yazar bilgilerini güncelle (Sadece Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Yazar ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Orhan Pamuk
 *               biography:
 *                 type: string
 *                 example: Güncellenmiş biyografi
 *               birthdate:
 *                 type: string
 *                 format: date
 *                 example: 1952-06-07
 *     responses:
 *       200:
 *         description: Yazar başarıyla güncellendi
 *       400:
 *         description: Geçersiz veri veya güncellenecek alan yok
 *       401:
 *         description: Yetkisiz
 *       403:
 *         description: Admin yetkisi gerekli
 *       404:
 *         description: Yazar bulunamadı
 */

/**
 * @swagger
 * /api/v1/authors/{id}:
 *   delete:
 *     tags:
 *       - Authors
 *     summary: Yazar sil (Sadece Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Yazar ID
 *     responses:
 *       200:
 *         description: Yazar başarıyla silindi
 *       401:
 *         description: Yetkisiz
 *       403:
 *         description: Admin yetkisi gerekli
 *       404:
 *         description: Yazar bulunamadı
 *       409:
 *         description: Yazara ait kitaplar var, silinemez
 */

/**
 * @swagger
 * /api/v1/authors/{id}/books:
 *   get:
 *     tags:
 *       - Authors
 *     summary: Yazara ait kitapları listele
 *     description: Verilen yazar ID'sine bağlı kitapları listeler (pagination opsiyonel).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Yazar ID
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
 *     responses:
 *       200:
 *         description: Yazarın kitapları başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       title:
 *                         type: string
 *                       isbn:
 *                         type: string
 *                       description:
 *                         type: string
 *                         nullable: true
 *                       authorid:
 *                         type: string
 *                         format: uuid
 *                       categoryid:
 *                         type: string
 *                         format: uuid
 *                       publishedat:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       stock:
 *                         type: integer
 *                       createdat:
 *                         type: string
 *                         format: date-time
 *                       updatedat:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalItems:
 *                       type: integer
 *                       example: 25
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPrevPage:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Geçersiz parametreler (örn. UUID formatı hatalı)
 *       404:
 *         description: Yazar bulunamadı
 */

const router = require("express").Router();
const authorController = require("../../controllers/authors.controller");
const validate = require("../../middlewares/validate.middleware");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");

const {
  authorIdParamSchema,
  createAuthorSchema,
  updateAuthorSchema,
  listAuthorsSchema,
  listAuthorBooksSchema
} = require("../../validators/authors.validator");

router.get("/", validate(listAuthorsSchema), authorController.listAuthors);
router.get("/:id", validate(authorIdParamSchema), authorController.getAuthorById);

router.post("/", authenticate, authorize("admin"), validate(createAuthorSchema), authorController.createAuthor);
router.put("/:id", authenticate, authorize("admin"), validate(updateAuthorSchema), authorController.updateAuthor);
router.delete("/:id", authenticate, authorize("admin"), validate(authorIdParamSchema), authorController.deleteAuthor);
router.get("/:id/books", validate(listAuthorBooksSchema), authorController.listAuthorBooks);

module.exports = router;