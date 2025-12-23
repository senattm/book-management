const router = require("express").Router();
const authController = require("../../controllers/auth.controller");
const validate = require("../../middlewares/validate.middleware");
const { authLimiter, registerLimiter } = require("../../middlewares/rateLimit.middleware");

const {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../../validators/auth.validator");

router.post("/register", registerLimiter, validate(registerSchema), authController.register);

router.post("/login", authLimiter, validate(loginSchema), authController.login);

router.post("/logout", validate(logoutSchema), authController.logout);

router.post("/refresh", validate(refreshSchema), authController.refresh);

router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

router.post("/reset-password", authLimiter, validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
