import { Router} from "express";
import { getAllPosts, createPost, getPostById } from "../controllers/postsController.js";

const router = Router();
router.get("/", getAllPosts);
router.post("/", createPost);
router.get("/:id", getPostById);

export default router;