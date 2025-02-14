import express, { Request, Response } from "express";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import dotenv from "dotenv";
import connectDB from "./shared/config/database";
import swaggerConfig from "./shared/config/swagger";
import { logger } from "./shared/services/logger.service";
import userRoutes from "./modules/users/user.routes";
import cryptoRoutes from "./modules/crypto/crypto.routes";
import { rabbitMQService } from "./shared/services/rabbitmq.service";
import symbolRoutes from "./modules/symbols/symbol.routes";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const specs = swaggerJsDoc(swaggerConfig(port));
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

app.use("/api/symbols", symbolRoutes);
app.use("/api/users", userRoutes);
app.use("/api/crypto", cryptoRoutes);

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello, crypto price alert with Express!" });
});

const startServer = async () => {
  try {
    await connectDB();
    await rabbitMQService.connect();
    console.log("RabbitMQ connected successfully");

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

const shutdown = async () => {
  try {
    logger.info("Shutting down server...");
    await rabbitMQService.close();
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  shutdown();
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection:", reason);
  shutdown();
});

startServer();
