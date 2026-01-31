import { Router } from "express";
import { getAllPosts, createPost, getPostById, updatePost } from "../controllers/postsController.js";

const router = Router();
router.get("/", getAllPosts);
router.post("/", createPost);
router.get("/:id", getPostById);
router.put("/:id", updatePost);

export default router;
