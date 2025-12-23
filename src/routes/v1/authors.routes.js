const router = require("express").Router();
const authorController = require("../../controllers/authors.controller");
const validate = require("../../middlewares/validate.middleware");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");

const {
  authorIdParamSchema,
  createAuthorSchema,
  updateAuthorSchema,
  listAuthorsSchema,
} = require("../../validators/authors.validator");

router.get("/", validate(listAuthorsSchema), authorController.listAuthors);
router.get("/:id", validate(authorIdParamSchema), authorController.getAuthorById);

router.post("/", authenticate, authorize("admin"), validate(createAuthorSchema), authorController.createAuthor);
router.put("/:id", authenticate, authorize("admin"), validate(updateAuthorSchema), authorController.updateAuthor);
router.delete("/:id", authenticate, authorize("admin"), validate(authorIdParamSchema), authorController.deleteAuthor);

module.exports = router;
