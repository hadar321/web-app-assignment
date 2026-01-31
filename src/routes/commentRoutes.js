import { Router } from "express";
import {
    createComment,
    getAllComments,
    getCommentById,
} from "../controllers/commentsController.js";

const router = Router();

router.get("/", getAllComments);

router.get("/:id", getCommentById);

router.post("/", createComment);

export default router;