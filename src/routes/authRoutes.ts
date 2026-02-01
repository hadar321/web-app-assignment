import { Router } from "express";
import usersController from "../controllers/usersController";

const router = Router();

router.post("/register", usersController.create);
router.post("/login", usersController.login);
router.post("/refresh", usersController.refresh);
router.post("/logout", usersController.logout);

export default router;