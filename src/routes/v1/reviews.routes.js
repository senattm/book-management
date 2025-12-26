/**
 * @swagger
 * /api/v1/reviews/{id}/reviews:
 *   get:
 *     tags:
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
 *                         minimum: 1
 *                         maximum: 5
 *                       comment:
 *                         type: string
 *                       userid:
 *                         type: string
 *                       bookid:
 *                         type: string
 *                       createdat:
 *                         type: string
 *                         format: date-time
 *                       updatedat:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *       404:
 *         description: Kitap bulunamadı
 *       400:
 *         description: Geçersiz ID formatı
 */

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   put:
 *     tags:
 *       - Reviews
 *     summary: Yorumu güncelle (Sadece kendi yorumunu güncelleyebilir)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Yorum ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 example: Güncellenen yorum metni
 *     responses:
 *       200:
 *         description: Yorum başarıyla güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 rating:
 *                   type: integer
 *                 comment:
 *                   type: string
 *                 userid:
 *                   type: string
 *                 bookid:
 *                   type: string
 *                 updatedat:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Geçersiz veri veya güncellenecek alan yok
 *       401:
 *         description: Yetkisiz
 *       403:
 *         description: Bu yorum size ait değil
 *       404:
 *         description: Yorum bulunamadı
 */

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   delete:
 *     tags:
 *       - Reviews
 *     summary: Yorumu sil (Sadece kendi yorumunu silebilir)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Yorum ID
 *     responses:
 *       200:
 *         description: Yorum başarıyla silindi
 *       401:
 *         description: Yetkisiz
 *       403:
 *         description: Bu yorum size ait değil
 *       404:
 *         description: Yorum bulunamadı
 */

const router = require("express").Router();
const reviewController = require("../../controllers/reviews.controller");
const validate = require("../../middlewares/validate.middleware");
const { authenticate } = require("../../middlewares/auth.middleware");
const {
  reviewIdParamSchema,
  updateReviewSchema,
} = require("../../validators/reviews.validator");
const bookIdParamSchema = require("../../validators/book.validator");

router.get("/:id/reviews", validate(bookIdParamSchema), reviewController.getReviewsByBook);

router.put(
  "/:id",
  authenticate,
  validate(updateReviewSchema),
  reviewController.updateReview
);

router.delete(
  "/:id",
  authenticate,
  validate(reviewIdParamSchema),
  reviewController.deleteReview
);

module.exports = router;