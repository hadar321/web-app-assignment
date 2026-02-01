import { Router } from "express";
import commentsController from "../controllers/commentsController";
import { authMiddleware } from "../controllers/usersController";
const router = Router();

router.use(authMiddleware);
/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: The Comments API
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - content
 *         - _id
 *         - postId
 *         - sender
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the comment
 *         content:
 *           type: string
 *           description: The content of the comment
 *         postId:
 *           type: string
 *           description: The id of the related post of the comment
 *         sender:
 *           type: string
 *           description: The sender id of the comment
 *       example:
 *         _id: 231266t90731aj883d33g4
 *         content: comment Comment comment
 *         postId: 31aj883d33g4
 *         sender: 231266t90712
 */
/**
 * @swagger
 * /comments:
 *   get:
 *     summary: Get all comments
 *     description: Retrieve a list of all comments. If query params are added, it will filter base on the params.
 *     tags:
 *       - Comments
 *     security:
 *       - authorization: []
 *     parameters:
 *       - in: query
 *         name: sender
 *         schema:
 *           type: string
 *         required: false
 *         description: The sender ID to filter by the comments
 *       - in: query
 *         name: postId
 *         schema:
 *           type: string
 *         required: false
 *         description: The post ID to filter by the comments
 *     responses:
 *       200:
 *         description: A list of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       500:
 *         description: Server error
 */
router.get("/", commentsController.getAll);

/**
 * @swagger
 * /comments/{id}:
 *   get:
 *     summary: Get a comment by ID
 *     description: Retrieve a single comment by its ID
 *     tags:
 *       - Comments
 *     security:
 *       - authorization: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the comment
 *     responses:
 *       200:
 *         description: A single comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.get("/:id", commentsController.getById);

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Create a new comment
 *     description: Create a new comment
 *     tags:
 *       - Comments
 *     security:
 *       - authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The content of the comment
 *             required:
 *               - content
 *     responses:
 *       201:
 *         description: The new comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post("/", commentsController.create);

/**
 * @swagger
 * /comments:
 *   put:
 *     summary: Update a comment
 *     description: Uppdate a comment
 *     tags:
 *       - Comments
 *     security:
 *       - authorization: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The content of the comment
 *     responses:
 *       201:
 *         description: The comment after the update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.put("/:id", commentsController.update);

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment by ID
 *     description: Delete a single comment by its ID
 *     tags:
 *       - Comments
 *     security:
 *       - authorization: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the comment
 *     responses:
 *       200:
 *         description: The deleted comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */

router.delete("/:id", commentsController.delete);

export default router;
