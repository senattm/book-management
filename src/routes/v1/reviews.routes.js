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