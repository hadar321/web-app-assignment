import { Router } from "express";
import postsController from "../controllers/postsController.js";

const router = Router();
router.get("/", postsController.getAll);
router.post("/", postsController.create);
router.get("/:id", postsController.getById);
router.put("/:id", postsController.update);

export default router;
