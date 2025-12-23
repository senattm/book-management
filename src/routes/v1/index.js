const router = require("express").Router();

const healthRoutes = require("./health.routes");
const bookRoutes = require("./book.routes");
const authRoutes = require("./auth.routes");
const reviewRoutes = require("./reviews.routes");
const authorRoutes = require("./authors.routes");

router.use("/health", healthRoutes);
router.use("/book", bookRoutes);
router.use("/auth", authRoutes);
router.use("/reviews", reviewRoutes);
router.use("/authors", authorRoutes)
 
module.exports = router;
