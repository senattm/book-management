const router = require("express").Router();
const bookController = require("../../controllers/book.controller");
const validate = require("../../middlewares/validate.middleware");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const {
  createBookSchema,
  listBooksSchema,
  bookIdParamSchema,
  updateBookSchema,
} = require("../../validators/book.validator");

router.get("/", validate(listBooksSchema), bookController.getAllBooks);
router.get("/:id", validate(bookIdParamSchema), bookController.getBookById);
router.get("/:id/reviews", validate(bookIdParamSchema), bookController.getBookReviews);

router.post("/", authenticate, authorize("admin"), validate(createBookSchema), bookController.createBook);
router.put("/:id", authenticate, authorize("admin"), validate(updateBookSchema), bookController.updateBook);
router.delete("/:id", authenticate, authorize("admin"), validate(bookIdParamSchema), bookController.deleteBook);

module.exports = router;