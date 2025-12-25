const router = require("express").Router();

const healthRoutes = require("./health.routes");
const bookRoutes = require("./book.routes");
const authRoutes = require("./auth.routes");
const reviewRoutes = require("./reviews.routes");
const authorRoutes = require("./authors.routes");
const categoryRoutes = require("./categories.routes");
const userRoutes = require("./users.routes");

router.use("/health", healthRoutes);
router.use("/book", bookRoutes);
router.use("/auth", authRoutes);
router.use("/reviews", reviewRoutes);
router.use("/authors", authorRoutes);
router.use("/categories", categoryRoutes);
router.use("/users", userRoutes); 

module.exports = router;
