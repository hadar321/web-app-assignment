import userModel, { IUser } from "../models/userModel";
import { Request, Response } from "express";
import BaseController from "./baseController";
import bcrypt from "bcrypt";

class UsersController extends BaseController<IUser> {
  constructor() {
    super(userModel);
  }

  async create(req: Request, res: Response) {
    try {
      const password = req?.body?.password;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        req.body.password = hashedPassword;
      }
      await super.create(req, res);
    } catch (error) {
      res.status(400).send(error);
    }
  }

  getFilterFields() {
    return ["username", "email"];
  }

  getUpdateFields() {
    return ["username", "email", "password"];
  }
}

export default new UsersController();