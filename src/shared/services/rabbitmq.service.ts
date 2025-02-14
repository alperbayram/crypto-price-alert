import amqp, { Channel, Connection, ConsumeMessage } from "amqplib";
import { logger } from "./logger.service";

class RabbitMQService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly PRICE_ALERT_QUEUE = "price_alerts";
  private readonly NOTIFICATION_QUEUE = "notifications";
  private readonly DLX_EXCHANGE = "dlx";
  private readonly DLQ_QUEUE = "dead_letter_queue";

  async connect() {
    try {
      logger.info("Attempting to connect to RabbitMQ...");
      const url = process.env.RABBITMQ_URI || "amqp://127.0.0.1:5672";
      logger.info(`Connecting to RabbitMQ at ${url}`);

      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      await this.setupDeadLetterExchange();

      await this.setupQueues();

      this.setupEventListeners();

      logger.info("Successfully connected to RabbitMQ");
    } catch (error) {
      logger.error("Failed to connect to RabbitMQ", error);
      throw error;
    }
  }

  private async setupDeadLetterExchange() {
    if (!this.channel) return;

    await this.channel.assertExchange(this.DLX_EXCHANGE, "direct");
    await this.channel.assertQueue(this.DLQ_QUEUE);
    await this.channel.bindQueue(
      this.DLQ_QUEUE,
      this.DLX_EXCHANGE,
      "dead-letter"
    );
  }

  private async setupQueues() {
    if (!this.channel) return;

    const queueOptions = {
      deadLetterExchange: this.DLX_EXCHANGE,
      deadLetterRoutingKey: "dead-letter",
      messageTtl: 30000, // 30 seconds TTL
    };

    await this.channel.assertQueue(this.PRICE_ALERT_QUEUE, {
      durable: true,
      ...queueOptions,
    });

    await this.channel.assertQueue(this.NOTIFICATION_QUEUE, {
      durable: true,
      ...queueOptions,
    });

    logger.info("Queues setup completed");
  }

  private setupEventListeners() {
    if (!this.connection || !this.channel) return;

    this.connection.on("error", (error) => {
      logger.error("RabbitMQ connection error", error);
    });

    this.connection.on("close", () => {
      logger.warn("RabbitMQ connection closed");
      this.retryConnect();
    });

    this.channel.on("error", (error) => {
      logger.error("RabbitMQ channel error", error);
    });

    this.channel.on("close", () => {
      logger.warn("RabbitMQ channel closed");
    });

    process.on("SIGINT", this.close.bind(this));
    process.on("SIGTERM", this.close.bind(this));
  }

  private async retryConnect(retryCount = 0, maxRetries = 5) {
    if (retryCount >= maxRetries) {
      logger.error(
        "Max retry attempts reached. Failed to reconnect to RabbitMQ."
      );
      return;
    }

    try {
      logger.info(
        `Attempting to reconnect to RabbitMQ... (Attempt ${retryCount + 1})`
      );
      await this.connect();
    } catch (error) {
      const nextRetry = Math.min(1000 * Math.pow(2, retryCount), 30000);
      logger.warn(`Reconnect failed. Retrying in ${nextRetry}ms...`);
      setTimeout(() => this.retryConnect(retryCount + 1), nextRetry);
    }
  }

  async publishAlert(alert: any) {
    if (!this.channel) {
      logger.error("Cannot publish alert: Channel not established");
      throw new Error("RabbitMQ channel is not established");
    }

    try {
      const success = this.channel.sendToQueue(
        this.PRICE_ALERT_QUEUE,
        Buffer.from(JSON.stringify(alert)),
        {
          persistent: true,
          messageId: alert._id?.toString() || new Date().toISOString(),
          timestamp: new Date().getTime(),
        }
      );

      if (success) {
        logger.info("Alert published successfully", { alertId: alert._id });
      } else {
        logger.warn("Alert publish deferred - queue full", {
          alertId: alert._id,
        });
      }
    } catch (error) {
      logger.error("Failed to publish alert", { error, alert });
      throw error;
    }
  }

  async publishNotification(notification: any) {
    if (!this.channel) {
      throw new Error("RabbitMQ channel is not established");
    }

    try {
      this.channel.sendToQueue(
        this.NOTIFICATION_QUEUE,
        Buffer.from(JSON.stringify(notification))
      );
    } catch (error) {
      logger.error("Error publishing notification:", error);
      throw error;
    }
  }

  async consumeAlerts(callback: (alert: any) => Promise<void>) {
    if (!this.channel) {
      logger.error("Cannot consume alerts: Channel not established");
      throw new Error("RabbitMQ channel is not established");
    }

    try {
      await this.channel.prefetch(1);

      this.channel.consume(
        this.PRICE_ALERT_QUEUE,
        async (msg: ConsumeMessage | null) => {
          if (!msg) return;

          try {
            const alert = JSON.parse(msg.content.toString());
            await callback(alert);
            this.channel?.ack(msg);
            logger.info("Alert processed successfully", {
              messageId: msg.properties.messageId,
            });
          } catch (error) {
            logger.error("Error processing alert", {
              error,
              messageId: msg.properties.messageId,
            });

            this.channel?.reject(msg, false);
          }
        }
      );

      logger.info("Alert consumer setup completed");
    } catch (error) {
      logger.error("Failed to setup alert consumer", error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        logger.info("RabbitMQ channel closed");
      }

      if (this.connection) {
        await this.connection.close();
        logger.info("RabbitMQ connection closed");
      }
    } catch (error) {
      logger.error("Error closing RabbitMQ connection:", error);
      throw error;
    }
  }
}

export const rabbitMQService = new RabbitMQService();
