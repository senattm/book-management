const router = require("express").Router();

const {
  createBookHandler,
  listBooksHandler,
  getBookByIdHandler,
  updateBookHandler,
  deleteBookHandler,
  getBookReviewsHandler
} = require("../../controllers/book.controller");

const validate = require("../../middlewares/validate.middleware");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const {
  createBookSchema,
  listBooksSchema,
  bookIdParamSchema,
  updateBookSchema,
} = require("../../validators/book.validator");

router.get("/", validate(listBooksSchema), listBooksHandler);

router.get("/:id", validate(bookIdParamSchema), getBookByIdHandler);

router.get("/:id/reviews", validate(bookIdParamSchema), getBookReviewsHandler);
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(createBookSchema),
  createBookHandler
);

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(updateBookSchema),
  updateBookHandler
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(bookIdParamSchema),
  deleteBookHandler
);

module.exports = router;
