import WebSocket from "ws";
import Alert from "./alert.model";
import { rabbitMQService } from "../../shared/services/rabbitmq.service";
import { Types } from "mongoose";

interface CacheData {
  data: any;
  expires: number;
}

export enum AlertType {
  ABOVE = "ABOVE",
  BELOW = "BELOW",
}

export enum DurationType {
  ONCE = "ONCE",
  ONE_DAY = "ONE_DAY",
  CONTINUOUS = "CONTINUOUS",
}

export interface AlertData {
  userId: Types.ObjectId | string;
  symbol: string;
  targetPrice: number;
  type: AlertType;
  durationType: DurationType;
}

export interface UpdateAlertData {
  symbol?: string;
  targetPrice?: number;
  type?: AlertType;
  durationType?: DurationType;
  isActive?: boolean;
}

export class AlertService {
  private static readonly RECONNECT_DELAY = 5000;
  private static readonly BATCH_SIZE = 100;
  private static readonly CACHE_TTL = 60000; // 1 dakika

  private ws: WebSocket | null = null;
  private activeSymbols: Set<string> = new Set();
  private lastProcessedPrices: Map<string, number> = new Map();
  private alertCache: Map<string, CacheData> = new Map();
  private processingQueue: Map<string, boolean> = new Map();

  constructor() {
    this.startMonitoring();
    this.setupExpirationCheck();
    this.setupAlertConsumer();
    this.setupCacheCleanup();
  }

  async createAlert(alertData: AlertData) {
    try {
      this.validateAlertData(alertData);

      const alert = new Alert(alertData);
      await alert.save();

      await rabbitMQService.publishAlert(alert);
      await this.addSymbol(alert.symbol);

      this.invalidateUserCache(alertData.userId.toString());

      return alert;
    } catch (error) {
      console.error("Error creating alert:", error);
      throw error;
    }
  }

  async getAlertsByUserId(
    userId: string | Types.ObjectId,
    page = 1,
    limit = 20
  ) {
    const cacheKey = `alerts_${userId.toString()}_${page}_${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const alerts = await Alert.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    this.setCache(cacheKey, alerts);
    return alerts;
  }

  async getAlertById(id: string | Types.ObjectId) {
    const cacheKey = `alert_${id.toString()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const alert = await Alert.findById(id).lean();
    if (alert) {
      this.setCache(cacheKey, alert);
    }
    return alert;
  }

  async updateAlert(id: string | Types.ObjectId, updateData: UpdateAlertData) {
    try {
      const updateObj: any = { ...updateData };

      if (updateData.durationType === DurationType.ONE_DAY) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        updateObj.expiresAt = tomorrow;
      } else if (updateData.durationType) {
        updateObj.expiresAt = undefined;
      }

      const alert = await Alert.findOneAndUpdate(
        { _id: id, isThresholdPassed: false },
        { $set: updateObj },
        { new: true, runValidators: true }
      );

      if (!alert) {
        throw new Error("Alert not found or already triggered");
      }

      if (updateData.symbol) {
        await this.addSymbol(updateData.symbol);
      }

      this.invalidateUserCache(alert.userId.toString());
      this.invalidateAlertCache(id.toString());

      return alert;
    } catch (error) {
      console.error("Error updating alert:", error);
      throw error;
    }
  }

  async deleteAlert(id: string | Types.ObjectId) {
    try {
      const alert = await Alert.findByIdAndDelete(id);
      if (alert) {
        this.invalidateUserCache(alert.userId.toString());
        this.invalidateAlertCache(id.toString());
      }
      return alert;
    } catch (error) {
      console.error("Error deleting alert:", error);
      throw error;
    }
  }

  async getActiveAlertsByUserId(userId: string | Types.ObjectId) {
    const cacheKey = `active_alerts_${userId.toString()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const alerts = await Alert.find({
      userId,
      isActive: true,
    }).lean();

    this.setCache(cacheKey, alerts);
    return alerts;
  }

  private async setupAlertConsumer() {
    try {
      await rabbitMQService.connect();
      await rabbitMQService.consumeAlerts(async (alert) => {
        await this.processAlert(alert);
      });
    } catch (error) {
      console.error("Error setting up alert consumer:", error);
    }
  }

  private async processAlert(alert: any) {
    try {
      console.log("Processing alert:", alert);

      await rabbitMQService.publishNotification({
        userId: alert.userId.toString(),
        message: `Price alert triggered for ${alert.symbol}`,
        alertId: alert._id.toString(),
        price: alert.targetPrice,
      });
    } catch (error) {
      console.error("Error processing alert:", error);
    }
  }

  private setupExpirationCheck() {
    setInterval(async () => {
      try {
        const now = new Date();
        const result = await Alert.updateMany(
          {
            isActive: true,
            durationType: DurationType.ONE_DAY,
            expiresAt: { $lt: now },
          },
          {
            isActive: false,
          }
        );

        if (result.modifiedCount > 0) {
          this.alertCache.clear();
        }
      } catch (error) {
        console.error("Error checking expired alerts:", error);
      }
    }, 1000 * 60 * 60); // Her saat
  }

  private async startMonitoring() {
    try {
      const alerts = await Alert.find({ isActive: true });
      this.activeSymbols = new Set(
        alerts.map((alert) => alert.symbol.toLowerCase())
      );
      this.connectWebSocket();
    } catch (error) {
      console.error("Error starting alert monitoring:", error);
    }
  }

  private connectWebSocket() {
    if (this.ws) {
      this.ws.close();
    }

    if (this.activeSymbols.size === 0) return;

    try {
      const symbolChunks = this.chunkSymbols(
        Array.from(this.activeSymbols),
        200
      );

      for (const chunk of symbolChunks) {
        const streams = chunk
          .map((symbol) => `${symbol.toLowerCase()}@trade`)
          .join("/");
        const url = `wss://stream.binance.com:9443/ws/${streams}`;

        this.ws = new WebSocket(url);
        this.setupWebSocketHandlers(this.ws);
      }
    } catch (error) {
      console.error("WebSocket connection error:", error);
      setTimeout(() => this.connectWebSocket(), AlertService.RECONNECT_DELAY);
    }
  }

  private setupWebSocketHandlers(ws: WebSocket) {
    ws.on("message", async (data: WebSocket.Data) => {
      try {
        const trade = JSON.parse(data.toString());
        const symbol = trade.s;
        const price = parseFloat(trade.p);

        const lastPrice = this.lastProcessedPrices.get(symbol);
        if (lastPrice === price) return;

        this.lastProcessedPrices.set(symbol, price);
        await this.processPrice(symbol, price);
      } catch (error) {
        console.error("Error processing trade:", error);
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      setTimeout(() => this.connectWebSocket(), AlertService.RECONNECT_DELAY);
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
      setTimeout(() => this.connectWebSocket(), AlertService.RECONNECT_DELAY);
    });
  }

  private async processPrice(symbol: string, currentPrice: number) {
    if (this.processingQueue.get(symbol)) return;

    try {
      this.processingQueue.set(symbol, true);

      let skip = 0;
      while (true) {
        const alerts = await Alert.find({
          symbol,
          isActive: true,
          isThresholdPassed: false,
        })
          .skip(skip)
          .limit(AlertService.BATCH_SIZE)
          .lean();

        if (alerts.length === 0) break;

        await Promise.all(
          alerts.map((alert) => this.checkAndTriggerAlert(alert, currentPrice))
        );

        skip += AlertService.BATCH_SIZE;
      }
    } finally {
      this.processingQueue.set(symbol, false);
    }
  }

  private async checkAndTriggerAlert(alert: any, currentPrice: number) {
    const priceConditionMet =
      alert.type === AlertType.ABOVE
        ? currentPrice >= alert.targetPrice
        : currentPrice <= alert.targetPrice;

    if (priceConditionMet) {
      await this.triggerAlert(alert, alert.symbol, currentPrice);
    }
  }

  private async triggerAlert(alert: any, symbol: string, currentPrice: number) {
    try {
      if (alert.isThresholdPassed) {
        return;
      }

      console.log(`🔔 Alert triggered for ${symbol}!`);
      console.log(`Target price: ${alert.targetPrice}`);
      console.log(`Current price: ${currentPrice}`);
      console.log(`Alert type: ${alert.type}`);
      console.log(`Duration type: ${alert.durationType}`);
      console.log("-------------------");

      const updateData: any = {
        triggerCount: alert.triggerCount + 1,
        triggeredAt: new Date(),
        isThresholdPassed: true,
      };

      if (alert.durationType === DurationType.ONCE) {
        updateData.isActive = false;
      } else if (alert.durationType === DurationType.ONE_DAY) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        updateData.expiresAt = tomorrow;
      }

      await Alert.findByIdAndUpdate(alert._id, { $set: updateData });
      this.invalidateUserCache(alert.userId.toString());
      this.invalidateAlertCache(alert._id.toString());
    } catch (error) {
      console.error("Error triggering alert:", error);
    }
  }

  async addSymbol(symbol: string) {
    const lowerSymbol = symbol.toLowerCase();
    if (!this.activeSymbols.has(lowerSymbol)) {
      this.activeSymbols.add(lowerSymbol);
      this.connectWebSocket();
    }
  }

  private validateAlertData(data: AlertData) {
    if (!data.userId || !data.symbol || !data.targetPrice) {
      throw new Error("Missing required fields");
    }
    if (!Object.values(AlertType).includes(data.type)) {
      throw new Error("Invalid alert type");
    }
    if (!Object.values(DurationType).includes(data.durationType)) {
      throw new Error("Invalid duration type");
    }
  }

  private getFromCache(key: string) {
    const cached = this.alertCache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      this.alertCache.delete(key);
      return null;
    }
    return cached.data;
  }

  private setCache(key: string, data: any) {
    this.alertCache.set(key, {
      data,
      expires: Date.now() + AlertService.CACHE_TTL,
    });
  }

  private invalidateUserCache(userId: string) {
    for (const key of this.alertCache.keys()) {
      if (key.includes(userId)) {
        this.alertCache.delete(key);
      }
    }
  }

  private invalidateAlertCache(alertId: string) {
    this.alertCache.delete(`alert_${alertId}`);
  }

  private setupCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.alertCache.entries()) {
        if (value.expires < now) {
          this.alertCache.delete(key);
        }
      }
    }, AlertService.CACHE_TTL);
  }

  private chunkSymbols(symbols: string[], size: number): string[][] {
    return symbols.reduce((chunks, symbol, index) => {
      const chunkIndex = Math.floor(index / size);
      chunks[chunkIndex] = chunks[chunkIndex] || [];
      chunks[chunkIndex].push(symbol);
      return chunks;
    }, [] as string[][]);
  }
}

export const alertService = new AlertService();
