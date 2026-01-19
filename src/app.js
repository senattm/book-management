const express = require("express");
const routes = require("./routes");
const errorMiddleware = require("./middlewares/error.middleware");
const { globalLimiter } = require("./middlewares/rateLimit.middleware");
const loggerMiddleware = require("./middlewares/logger.middleware");
const swaggerUi = require("swagger-ui-express");
const { getOpenApiSpec } = require("./config/openapi");

const app = express();

app.set("trust proxy", 1);
app.use(express.json());
// Swagger documentation
try {
  const { getOpenApiSpec } = require("./config/openapi");
  const openApiSpecs = getOpenApiSpec();
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpecs));
  console.log("Swagger docs initialized at /api-docs");
} catch (err) {
  console.error("Failed to initialize Swagger UI:", err);
}

const isTest = process.env.NODE_ENV === "test";

app.use(loggerMiddleware);

if (!isTest) {
  app.use("/api", globalLimiter);
}

app.use("/api", routes);

app.get("/", (req, res) => {
  res.json({ message: "Book Management API Çalışıyor" });
});

app.use(errorMiddleware);

module.exports = app;
