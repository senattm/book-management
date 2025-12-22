const router = require("express").Router();
const reviewController = require("../../controllers/reviews.controller");
const validate = require("../../middlewares/validate.middleware");
const { authenticate } = require("../../middlewares/auth.middleware");
const {
  reviewIdParamSchema,
  updateReviewSchema,
} = require("../../validators/reviews.validator");
const bookIdParamSchema = require ("../../validators/book.validator");

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