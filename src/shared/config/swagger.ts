import { SwaggerOptions } from "swagger-ui-express";

const swaggerConfig = (port: number): SwaggerOptions => ({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Express API with Swagger",
      version: "1.0.0",
      description: "A simple Express API",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
      },
    ],
  },
  apis: ["./src/**/*.ts"],
});

export default swaggerConfig;
