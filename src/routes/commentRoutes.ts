import { Router } from "express";
import commentsController from "../controllers/commentsController";
import { authMiddleware } from "../controllers/usersController";
const router = Router();

router.use(authMiddleware);

router.get("/", commentsController.getAll);

router.get("/:id", commentsController.getById);

router.post("/", commentsController.create);

router.put("/:id", commentsController.update);

router.delete("/:id", commentsController.delete);

export default router;
