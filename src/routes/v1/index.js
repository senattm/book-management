const router = require("express").Router();

const healthRoutes = require("./health.routes");
const bookRoutes = require("./book.routes");
const authRoutes = require("./auth.routes");

router.use("/health", healthRoutes);
router.use("/book", bookRoutes);
router.use("/auth", authRoutes);
 
module.exports = router;
