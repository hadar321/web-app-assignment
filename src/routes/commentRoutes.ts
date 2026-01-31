import { Router } from "express";
import {
  createComment,
  deleteComment,
  getAllComments,
  getCommentById,
  updateComment,
} from "../controllers/commentsController.js";

const router = Router();

router.get("/", getAllComments);

router.get("/:id", getCommentById);

router.post("/", createComment);

router.put("/:id", updateComment);

router.delete("/:id", deleteComment);

export default router;
