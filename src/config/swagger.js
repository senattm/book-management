const swaggerJSDoc = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Book Management API",
      version: "1.0.0",
      description: "Book Management backend API dokümantasyonu",
    },
    servers: [
      { 
        url: "http://localhost:3000", 
        description: "Local Server" 
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }], 
  },
  apis: [
    "./src/routes/v1/*.js",
    "./src/routes/*.js",
    "./src/app.js"
  ],
};

module.exports = swaggerJSDoc(swaggerOptions);