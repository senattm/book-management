/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Kendi profil bilgilerini getir
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil bilgileri başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                   enum: [user, admin]
 *                 createdat:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Yetkisiz
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Tüm kullanıcıları listele (Sadece Admin)
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
 *         description: Sayfa başına kullanıcı sayısı
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Kullanıcı adı veya email'de arama
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *         description: Role göre filtrele
 *     responses:
 *       200:
 *         description: Kullanıcı listesi başarıyla getirildi
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
 *       401:
 *         description: Yetkisiz
 *       403:
 *         description: Admin yetkisi gerekli
 */

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: ID'ye göre kullanıcı getir (Sadece Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Kullanıcı ID
 *     responses:
 *       200:
 *         description: Kullanıcı başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 createdat:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Yetkisiz
 *       403:
 *         description: Admin yetkisi gerekli
 *       404:
 *         description: Kullanıcı bulunamadı
 */

/**
 * @swagger
 * /api/v1/users/{id}/borrowings:
 *   get:
 *     tags:
 *       - Users
 *     summary: Kullanıcının ödünç alma geçmişini getir (Kullanıcı sadece kendisini, admin herkesi görebilir)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Kullanıcı ID
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, returned, overdue]
 *         description: Ödünç alma durumuna göre filtrele
 *     responses:
 *       200:
 *         description: Ödünç alma geçmişi başarıyla getirildi
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
 *                       borrowdate:
 *                         type: string
 *                         format: date-time
 *                       duedate:
 *                         type: string
 *                         format: date
 *                       returndate:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Yetkisiz
 *       403:
 *         description: Bu kullanıcının kayıtlarını görme yetkiniz yok
 *       404:
 *         description: Kullanıcı bulunamadı
 */

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Kullanıcı bilgilerini güncelle (Kullanıcı kendisini, admin herkesi güncelleyebilir)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Kullanıcı ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newemail@example.com
 *               name:
 *                 type: string
 *                 example: Yeni İsim
 *               avatar:
 *                 type: string
 *                 example: https://example.com/avatar.jpg
 *               password:
 *                 type: string
 *                 format: password
 *                 example: NewPassword123!
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 description: Sadece admin güncelleyebilir
 *     responses:
 *       200:
 *         description: Kullanıcı başarıyla güncellendi
 *       400:
 *         description: Geçersiz veri veya güncellenecek alan yok
 *       401:
 *         description: Yetkisiz
 *       403:
 *         description: Bu kullanıcıyı güncelleme yetkiniz yok veya admin sadece admin tarafından güncellenebilir
 *       404:
 *         description: Kullanıcı bulunamadı
 *       409:
 *         description: Email zaten kullanımda
 */

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Kullanıcı sil (Sadece Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Kullanıcı ID
 *     responses:
 *       200:
 *         description: Kullanıcı başarıyla silindi
 *       401:
 *         description: Yetkisiz
 *       403:
 *         description: Admin yetkisi gerekli
 *       404:
 *         description: Kullanıcı bulunamadı
 *       409:
 *         description: Kullanıcının aktif ödünç almaları var, silinemez
 */

const router = require("express").Router();
const usersController = require("../../controllers/users.controller");
const validate = require("../../middlewares/validate.middleware");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");

const {
  listUsersSchema,
  userIdParamSchema,
  updateUserSchema,
  borrowingsQuerySchema,
} = require("../../validators/users.validator");

router.get("/me", authenticate, usersController.getMe);

router.get(
  "/",
  authenticate,
  authorize("admin"),
  validate(listUsersSchema),
  usersController.listUsers
);

router.get(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(userIdParamSchema),
  usersController.getUserById
);

router.get(
  "/:id/borrowings",
  authenticate,
  validate(borrowingsQuerySchema),
  usersController.getUserBorrowings
);

router.put(
  "/:id",
  authenticate,
  validate(updateUserSchema),
  usersController.updateUser
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(userIdParamSchema),
  usersController.deleteUser
);

module.exports = router;