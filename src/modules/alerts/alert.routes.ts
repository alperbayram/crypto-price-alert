import express from "express";
import { AlertController } from "./alert.controller";
import { alertService } from "./alert.service";

const router = express.Router();
const alertController = new AlertController(alertService);

interface IdParam {
  id: string;
}

/**
 * @swagger
 * /api/alerts:
 *   post:
 *     tags: [Alerts]
 *     summary: Create new price alert
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - symbol
 *               - targetPrice
 *               - type
 *               - durationType
 *             properties:
 *               userId:
 *                 type: string
 *               symbol:
 *                 type: string
 *               targetPrice:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [ABOVE, BELOW]
 *               durationType:
 *                 type: string
 *                 enum: [CONTINUOUS, ONCE, ONE_DAY]
 */
router.post("/", alertController.createAlert);

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     tags: [Alerts]
 *     summary: Get all alerts for a user
 */
router.get("/", alertController.getAlerts);

/**
 * @swagger
 * /api/alerts/{id}:
 *   get:
 *     tags: [Alerts]
 *     summary: Get alert by ID
 */
router.get("/:id", alertController.getAlertById);

/**
 * @swagger
 * /api/alerts/{id}:
 *   put:
 *     tags: [Alerts]
 *     summary: Update alert by ID
 */
router.put("/:id", alertController.updateAlert);

/**
 * @swagger
 * /api/alerts/{id}:
 *   delete:
 *     tags: [Alerts]
 *     summary: Delete alert by ID
 */
router.delete("/:id", alertController.deleteAlert);

/**
 * @swagger
 * /api/alerts/user/{userId}/active:
 *   get:
 *     tags: [Alerts]
 *     summary: Get all active alerts for a user
 */
router.get("/user/:userId/active", alertController.getActiveAlerts);

export default router;
