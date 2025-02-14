import express from "express";
import { SymbolController } from "./symbol.controller";

const router = express.Router();
const symbolController = new SymbolController();

/**
 * @swagger
 * /api/symbols:
 *   get:
 *     tags: [Symbols]
 *     summary: Get all trading pair symbols
 *     responses:
 *       200:
 *         description: List of all symbols
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   symbol:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.get("/", symbolController.getAllSymbols);

/**
 * @swagger
 * /api/symbols/bulk:
 *   post:
 *     tags: [Symbols]
 *     summary: Create multiple trading pair symbols
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - symbol
 *               properties:
 *                 symbol:
 *                   type: string
 *           example:
 *             - symbol: "ETHBTC"
 *             - symbol: "BNBBTC"
 *     responses:
 *       201:
 *         description: Symbols created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   symbol:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.post("/bulk", symbolController.createSymbols);

/**
 * @swagger
 * /api/symbols/{symbol}:
 *   get:
 *     tags: [Symbols]
 *     summary: Get a specific trading pair symbol
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Trading pair symbol (e.g. ETHBTC)
 *     responses:
 *       200:
 *         description: Symbol details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 symbol:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Symbol not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.get("/:symbol", symbolController.getSymbolByName);

/**
 * @swagger
 * /api/symbols/{symbol}:
 *   delete:
 *     tags: [Symbols]
 *     summary: Delete a specific trading pair symbol
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Trading pair symbol to delete
 *     responses:
 *       200:
 *         description: Symbol deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Symbol not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.delete("/:symbol", symbolController.deleteSymbol);

export default router;
