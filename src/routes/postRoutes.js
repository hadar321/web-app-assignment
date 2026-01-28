import { Router} from "express";
import { createPost } from "../controllers/postsController.js";

const router = Router();
router.post("/", createPost);

export default router;