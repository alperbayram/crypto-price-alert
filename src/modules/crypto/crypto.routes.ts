import express, { Request, Response } from "express";
import axios from "axios";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Crypto
 *   description: Cryptocurrency market data endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TradeData:
 *       type: object
 *       properties:
 *         e:
 *           type: string
 *           description: Event type
 *           example: "trade"
 *         E:
 *           type: number
 *           description: Event time (Unix timestamp in milliseconds)
 *           example: 1739111009908837
 *         s:
 *           type: string
 *           description: Symbol (Trading pair)
 *           example: "ETHUSDT"
 *         t:
 *           type: number
 *           description: Trade ID
 *           example: 2142119925
 *         p:
 *           type: string
 *           description: Price
 *           example: "2624.20000000"
 *         q:
 *           type: string
 *           description: Quantity (Amount)
 *           example: "0.03160000"
 *         T:
 *           type: number
 *           description: Trade time (Unix timestamp in milliseconds)
 *           example: 1739111009908431
 *         m:
 *           type: boolean
 *           description: Is the buyer the market maker?
 *           example: false
 *         M:
 *           type: boolean
 *           description: Ignore
 *           example: true
 */

/**
 * @swagger
 * /api/crypto/prices:
 *   get:
 *     tags: [Crypto]
 *     summary: Get all crypto prices from Binance
 *     responses:
 *       200:
 *         description: List of crypto prices
 */
router.get("/prices", async (req: Request, res: Response) => {
  try {
    const response = await axios.get(
      "https://api.binance.com/api/v3/ticker/price"
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching prices:", error);
    res.status(500).json({ message: "Error fetching prices", error });
  }
});

export default router;
