/**
 * @swagger
 * /api/v1/borrowings:
 *   post:
 *     tags:
 *       - Borrowings
 *     summary: Yeni kitap ödünç al
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookid
 *             properties:
 *               bookid:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               duedate:
 *                 type: string
 *                 format: date
 *                 example: 2025-01-15
 *                 description: İade tarihi (belirtilmezse otomatik 14 gün)
 *     responses:
 *       201:
 *         description: Kitap başarıyla ödünç alındı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 bookid:
 *                   type: string
 *                 userid:
 *                   type: string
 *                 borrowdate:
 *                   type: string
 *                   format: date-time
 *                 duedate:
 *                   type: string
 *                   format: date
 *       400:
 *         description: Geçersiz veri
 *       401:
 *         description: Yetkisiz
 *       404:
 *         description: Kitap bulunamadı
 *       409:
 *         description: Kitap zaten ödünç alınmış veya kullanıcının iade etmediği kitaplar var
 */

/**
 * @swagger
 * /api/v1/borrowings/{id}/return:
 *   put:
 *     tags:
 *       - Borrowings
 *     summary: Ödünç alınan kitabı iade et
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ödünç alma kayıt ID
 *     responses:
 *       200:
 *         description: Kitap başarıyla iade edildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 bookid:
 *                   type: string
 *                 userid:
 *                   type: string
 *                 borrowdate:
 *                   type: string
 *                   format: date-time
 *                 duedate:
 *                   type: string
 *                   format: date
 *                 returndate:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Geçersiz ID formatı
 *       401:
 *         description: Yetkisiz
 *       403:
 *         description: Bu ödünç alma kaydı size ait değil
 *       404:
 *         description: Ödünç alma kaydı bulunamadı
 *       409:
 *         description: Kitap zaten iade edilmiş
 */

/**
 * @swagger
 * /api/v1/borrowings/overdue:
 *   get:
 *     tags:
 *       - Borrowings
 *     summary: Gecikmiş ödünç almaları listele (Kullanıcı kendi kayıtlarını görür)
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: Gecikmiş ödünç alma listesi başarıyla getirildi
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
 *                       bookid:
 *                         type: string
 *                       userid:
 *                         type: string
 *                       borrowdate:
 *                         type: string
 *                         format: date-time
 *                       duedate:
 *                         type: string
 *                         format: date
 *                       daysoverdue:
 *                         type: integer
 *                         example: 5
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Yetkisiz
 */
/**
 * @swagger
 * /api/v1/borrowings:
 *   get:
 *     tags:
 *       - Borrowings
 *     summary: Ödünç kayıtlarını listele (User kendi kayıtlarını görür, Admin kullanıcıya göre filtreleyebilir)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, returned]
 *         description: active => returnedat null, returned => returnedat dolu
 *       - in: query
 *         name: userid
 *         schema:
 *           type: string
 *           format: uuid
 *         description: (Sadece Admin) Belirli bir kullanıcının ödünç kayıtları
 *     responses:
 *       200:
 *         description: Ödünç listesi
 *       401:
 *         description: Yetkisiz
 */
const router = require("express").Router();
const borrowingController = require("../../controllers/borrowings.controller");
const validate = require("../../middlewares/validate.middleware");
const { authenticate } = require("../../middlewares/auth.middleware");

const {
  borrowingIdParamSchema,
  createBorrowingSchema,
  listOverdueSchema,
  listBorrowingsSchema
} = require("../../validators/borrowings.validator");

router.post("/", authenticate, validate(createBorrowingSchema), borrowingController.createBorrowing);

router.put(
  "/:id/return",
  authenticate,
  validate(borrowingIdParamSchema),
  borrowingController.returnBorrowing
);

router.get(
  "/overdue",
  authenticate,
  validate(listOverdueSchema),
  borrowingController.getOverdueBorrowings
);

router.get(
  "/",
  authenticate,
  validate(listBorrowingsSchema),
  borrowingController.listMyBorrowings
);

module.exports = router;