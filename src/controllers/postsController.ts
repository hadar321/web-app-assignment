import { Request, Response } from "express";
import postModel, { IPost } from "../models/postModel";
import userModel from "../models/userModel";
import BaseController from "./baseController";

class PostsController extends BaseController<IPost> {
  constructor() {
    super(postModel);
  }

  async create(req: Request, res: Response) {
    try {
      if (req.body.sender) {
        if (!(await userModel.findById(req.body.sender))) {
          throw new Error("Sender not found");
        }
      }
      await super.create(req, res);
    } catch (error) {
      res.status(400).send((error as Error).message);
    }
  }

  getFilterFields() {
    return ["sender"];
  }

  getUpdateFields() {
    return ["title", "content"];
  }
}

export default new PostsController();