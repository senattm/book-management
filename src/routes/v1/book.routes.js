const router = require("express").Router();

const { createBookHandler } = require("../../controllers/book.controller");
const validate = require("../../middlewares/validate.middleware");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const { createBookSchema } = require("../../validators/book.validator");

router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(createBookSchema),
  createBookHandler
);

module.exports = router;
