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