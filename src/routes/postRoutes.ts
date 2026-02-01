import { Router } from "express";
import postsController from "../controllers/postsController";
import { authMiddleware } from "../controllers/usersController";

const router = Router();
router.use(authMiddleware);

router.get("/", postsController.getAll);
router.post("/", postsController.create);
router.get("/:id", postsController.getById);
router.put("/:id", postsController.update);
router.delete("/:id", postsController.delete);

export default router;
