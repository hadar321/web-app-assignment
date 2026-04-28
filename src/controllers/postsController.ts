import { Request, Response } from "express";
import postModel, { IPost } from "../models/postModel";
import BaseController from "./baseController";
import { RootFilterQuery } from "mongoose";
import { generateEmbedding, cosineSimilarity, generateAnswer } from "../services/aiService";

class PostsController extends BaseController<IPost> {
  constructor() {
    super(postModel);
    this.smartSearch = this.smartSearch.bind(this);
  }

  async create(req: Request, res: Response) {
    try {
      req.body.sender = res.locals.userId;
      if (!req.body.title) {
        req.body.title = req.body.content ? req.body.content.substring(0, 30) : "Untitled Post";
      }
      if (req.file?.filename) {
        req.body.postImage = `uploads/${process.env.POST_IMAGES_DIR || 'postImages'}/${req.file.filename}`;
      }
      // Remove postImage if it's not a string
      if (req.body.postImage && typeof req.body.postImage !== 'string') {
        delete req.body.postImage;
      }
      
      const textToEmbed = `${req.body.title || ""} ${req.body.content || ""}`;
      if (textToEmbed.trim()) {
        try {
          req.body.embedding = await generateEmbedding(textToEmbed);
        } catch (e) {
          console.error("Failed to generate embedding", e);
        }
      }

      await super.create(req, res);
    } catch (error) {
      res.status(400).send((error as Error).message);
    }
  }

  async update(req: Request, res: Response) {
    try {
      if (req.file?.filename) {
        req.body.postImage = `uploads/${process.env.POST_IMAGES_DIR || 'postImages'}/${req.file.filename}`;
      }
      // Remove postImage if it's not a string
      if (req.body.postImage && typeof req.body.postImage !== 'string') {
        delete req.body.postImage;
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

  async smartSearch(req: Request, res: Response) {
    try {
      const query = req.query.q as string;
      if (!query) {
        res.status(400).send("Query is required");
        return;
      }

      const queryEmbedding = await generateEmbedding(query);
      if (!queryEmbedding || queryEmbedding.length === 0) {
        res.status(500).send("Failed to generate embedding for query");
        return;
      }

      const allPosts = await postModel.find({ embedding: { $exists: true, $ne: [] } });

      const scoredPosts = allPosts.map(post => {
        const score = cosineSimilarity(queryEmbedding, post.embedding!);
        return { post, score };
      });

      scoredPosts.sort((a, b) => b.score - a.score);
      const topPosts = scoredPosts.slice(0, 5).map(sp => sp.post);

      const answer = await generateAnswer(query, topPosts);

      res.status(200).send({
        answer,
        posts: topPosts
      });
    } catch (error: any) {
      console.error("Smart Search Error:", error);
      res.status(500).send("Smart Search failed");
    }
  }
}

export default new PostsController();
