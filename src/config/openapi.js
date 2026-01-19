const { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } = require('@asteasolutions/zod-to-openapi');
const { z } = require('zod');

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

function getOpenApiSpec() {
  require("../validators/auth.validator");
  require("../validators/authors.validator");
  require("../validators/book.validator");
  require("../validators/borrowings.validator");
  require("../validators/categories.validator");
  require("../validators/reviews.validator");
  require("../validators/users.validator");
  require("../validators/health.validator");

  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Book Management API',
      version: '1.0.0',
      description: 'Book Management backend API dokümantasyonu',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Local Server' }],
  });
}

module.exports = { registry, getOpenApiSpec };
