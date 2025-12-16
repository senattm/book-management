const router = require("express").Router();
const { createBookHandler } = require("../../controllers/book.controller");
const { createBookValidationRules } = require("../../validators/book.validator");

router.post("/", createBookValidationRules, createBookHandler);

module.exports = router;
