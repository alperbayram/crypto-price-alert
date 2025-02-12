// index.ts
import express, { Request, Response } from "express";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import dotenv from "dotenv";
import connectDB from "./shared/config/database";
import swaggerConfig from "./shared/config/swagger";
import { logger } from "./shared/services/logger.service";

// Environment variables configuration
dotenv.config();

// Express app initialization
const app = express();
const port = Number(process.env.PORT) || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger configuration and setup
const specs = swaggerJsDoc(swaggerConfig(port));
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Returns a hello message
 *     description: A simple endpoint that returns a greeting message
 *     responses:
 *       200:
 *         description: Hello message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello, TypeScript with Express!" });
});

// Server startup function
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    app.listen(port, () => {
      logger.info(`Server is running on http://localhost:${port}`);
      logger.info(
        `Swagger documentation is available at http://localhost:${port}/api-docs`
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
