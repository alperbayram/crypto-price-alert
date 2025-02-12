import express, { Router } from "express";
import { UserController } from "./user.controller";
import { userService } from "./user.service";

const router: Router = express.Router();
const userController = new UserController(userService);

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 */
router.get("/", (req, res) => userController.getAllUsers(req, res));

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post("/", (req, res) => userController.createUser(req, res));

export default router;
