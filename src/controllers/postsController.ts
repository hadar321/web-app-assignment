import { Request, Response } from "express";
import postModel, { IPost } from "../models/postModel";
import BaseController from "./baseController";
import { RootFilterQuery } from "mongoose";
import { generateEmbedding, cosineSimilarity, generateAnswer, chunkText } from "../services/aiService";

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
      if (req.body.postImage && typeof req.body.postImage !== 'string') {
        delete req.body.postImage;
      }

      const textToEmbed = `${req.body.title || ""} ${req.body.content || ""}`;
      if (textToEmbed.trim()) {
        try {
          const chunks = chunkText(textToEmbed);
          const chunkData = await Promise.all(
            chunks.map(async (text) => ({
              text,
              embedding: await generateEmbedding(text),
            }))
          );
          req.body.chunks = chunkData;
        } catch (e) {
          console.error("Failed to generate embeddings", e);
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
      if (req.body.postImage && typeof req.body.postImage !== 'string') {
        delete req.body.postImage;
      }
      
      const textToEmbed = `${req.body.title || ""} ${req.body.content || ""}`;
      if (textToEmbed.trim()) {
        try {
          const chunks = chunkText(textToEmbed);
          const chunkData = await Promise.all(
            chunks.map(async (text) => ({
              text,
              embedding: await generateEmbedding(text),
            }))
          );
          req.body.chunks = chunkData;
        } catch (e) {
          console.error("Failed to generate embeddings", e);
        }
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

      const pageNum = parseInt(req.query.page as string) || parseInt(req.query.pageNum as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (pageNum - 1) * limit;

      const items = await this.model.find(filter as RootFilterQuery<IPost>)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "username");
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
      const query = (req.query.q as string)?.trim();
      if (!query || query.length < 3) {
        res.status(400).send("A valid query of at least 3 characters is required");
        return;
      }

      const queryEmbedding = await generateEmbedding(query);
      if (!queryEmbedding || queryEmbedding.length === 0) {
        res.status(500).send("Failed to generate embedding for query");
        return;
      }

      // Fetch all posts that have chunks and populate the sender info
      const allPosts = await postModel.find({ "chunks.0": { $exists: true } }).populate("sender", "username");

      const scoredResults: { post: IPost; score: number }[] = [];
      const SIMILARITY_THRESHOLD = 0.65; // As per RAG guidelines (סף רלוונטיות)

      allPosts.forEach(post => {
        let maxScore = 0;
        post.chunks?.forEach(chunk => {
          const score = cosineSimilarity(queryEmbedding, chunk.embedding);
          if (score > maxScore) maxScore = score;
        });

        if (maxScore >= SIMILARITY_THRESHOLD) {
          scoredResults.push({ post, score: maxScore });
        }
      });

      // Sort by best score
      scoredResults.sort((a, b) => b.score - a.score);
      
      // Limit to Top-K (e.g., 5)
      const topResults = scoredResults.slice(0, 5);
      const topPosts = topResults.map(r => r.post);

      if (topPosts.length === 0) {
        res.status(200).send({
          answer: "מצטער, לא מצאתי פוסטים רלוונטיים בקהילה שיכולים לענות על השאלה הזו.",
          posts: []
        });
        return;
      }

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
