import express from "express";
const router = express.Router();
import usersController from "../controllers/usersController";

router.get("/", usersController.getAll);

router.get("/:id", usersController.getById);

router.post("/", usersController.create);

router.put("/:id", usersController.update);

router.delete("/:id", usersController.delete);

export default router;