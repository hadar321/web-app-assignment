import { Router } from "express";
import {
  createComment,
} from "../controllers/commentsController.js";

const router = Router();

router.post("/", createComment);

export default router;