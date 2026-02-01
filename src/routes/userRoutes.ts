import { Router } from "express";
import usersController, { authMiddleware } from "../controllers/usersController";
const router = Router();
router.use(authMiddleware);

router.get("/", usersController.getAll);

router.get("/:id", usersController.getById);

router.post("/", usersController.create);

router.put("/:id", usersController.update);

router.delete("/:id", usersController.delete);

export default router;