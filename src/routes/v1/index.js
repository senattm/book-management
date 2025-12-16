const router = require("express").Router();

const healthRoutes = require("./health.routes");
const bookRoutes = require("./book.routes");

router.use("/health", healthRoutes);
router.use("/book", bookRoutes);
 
module.exports = router;
