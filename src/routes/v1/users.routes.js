const router = require("express").Router();
const usersController = require("../../controllers/users.controller");
const validate = require("../../middlewares/validate.middleware");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");

const {
  listUsersSchema,
  userIdParamSchema,
  updateUserSchema,
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
