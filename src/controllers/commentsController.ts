import commentsModel, { IComment } from "../models/commentsModel.js";
import { Request, Response } from "express";
import BaseController from "./baseController.js";
import postModel from "../models/postModel.js";
import userModel from "../models/userModel.js";

class CommentsController extends BaseController<IComment> {
  constructor() {
    super(commentsModel);
  }

  async create(req: Request, res: Response) {
    try {
      if (req.body.postId) {
        if (!(await postModel.findById(req.body.postId))) {
          res.status(400).send("Post not found");
          return;
        }
      }

      if (req.body.sender) {
        if (!(await userModel.findById(req.body.sender))) {
          res.status(400).send("Sender not found");
          return;
        }
      }

      await super.create(req, res);
    } catch (error) {
      res.status(400).send(error);
    }
  }

  getFilterFields() {
    return ["sender", "postId"];
  }

  getUpdateFields() {
    return ["content"];
  }

}
export default new CommentsController();


