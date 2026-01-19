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