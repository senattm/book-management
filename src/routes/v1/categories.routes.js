const router = require("express").Router();
const categoryController = require("../../controllers/categories.controller");
const validate = require("../../middlewares/validate.middleware");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");

const {
  listCategoriesSchema,
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
  categoryBooksSchema,
} = require("../../validators/categories.validator");

router.get("/", validate(listCategoriesSchema), categoryController.listCategories);
router.get("/:id", validate(categoryIdParamSchema), categoryController.getCategoryById);
router.get("/:id/books", validate(categoryBooksSchema), categoryController.getCategoryBooks);

router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(createCategorySchema),
  categoryController.createCategory
);

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(updateCategorySchema),
  categoryController.updateCategory
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(categoryIdParamSchema),
  categoryController.deleteCategory
);

module.exports = router;
