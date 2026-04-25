import { Request, Response } from "express";
import postModel, { IPost } from "../models/postModel";
import BaseController from "./baseController";
import { RootFilterQuery } from "mongoose";

class PostsController extends BaseController<IPost> {
  constructor() {
    super(postModel);
  }

  async create(req: Request, res: Response) {
    try {
      req.body.sender = res.locals.userId;
      if (req.file?.filename) {
        req.body.postImage = `postImages/${req.file.filename}`;
      }
      await super.create(req, res);
    } catch (error) {
      res.status(400).send((error as Error).message);
    }
  }

  async update(req: Request, res: Response) {
    try {
      if (req.file?.filename) {
        req.body.postImage = `postImages/${req.file.filename}`;
      }
      await super.update(req, res);
    } catch (error) {
      res.status(400).send((error as Error).message);
    }
  }

  getFilterFields() {
    return ["sender"];
  }

  async getAll(req: Request, res: Response) {
    try {
      const filter: { [key: string]: any } = {};
      for (const field of this.getFilterFields()) {
        if (req.query[field]) filter[field] = req.query[field];
      }

      const pageNum = parseInt(req.query.pageNum as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (pageNum - 1) * limit;

      const items = await this.model.find(filter as RootFilterQuery<IPost>).sort({ _id: 1 }).skip(skip).limit(limit);
      res.send(items);
    } catch (error: any) {
      res.status(400).send(error);
    }
  }

  getUpdateFields() {
    return ["title", "content", "likedBy", "postImage"];
  }
}

export default new PostsController();
