import CommentModel from "../models/commentsModel.js";
import BaseController from "./baseController.js";
import { Request, Response } from "express";
import userModel from "../models/userModel.js";

class CommentsController extends BaseController<any> {
  constructor() {
    super(CommentModel);
  }  

  async create(req: Request, res: Response) {
    try {
      if (req.body.sender) {
        if (!(await userModel.findById(req.body.sender))) {
          throw new Error("sender not found");
        }
      }
      await super.create(req, res);
    } catch (error) {
      res.status(400).send((error as Error).message);
    }
  }

  getFilterFields() {
    return ["postId", "sender"];
  }

  getUpdateFields() {
    return ["content"];
  }
}

export default new CommentsController();