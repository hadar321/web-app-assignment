import { Router} from "express";
import { getAllPosts, createPost } from "../controllers/postsController.js";

const router = Router();
router.get("/", getAllPosts);
router.post("/", createPost);

export default router;