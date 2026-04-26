import { Request, Response } from "express";
import postModel, { IPost } from "../models/postModel";
import postEmbeddingModel, { IPostEmbedding } from "../models/postEmbeddingModel";
import BaseController from "./baseController";
import { RootFilterQuery } from "mongoose";
import { embedText, isAiEnabled, answerFromChunks } from "../services/aiService";

class PostsController extends BaseController<IPost> {
  constructor() {
    super(postModel);
  }

  private chunkText(text: string): string[] {
    const maxChunkSize = 1000;
    const overlap = 120;
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = Math.min(start + maxChunkSize, text.length);
      if (end < text.length) {
        const lastSpace = text.lastIndexOf(" ", end);
        if (lastSpace > start + 400) {
          end = lastSpace;
        }
      }

      const chunk = text.slice(start, end).trim();
      if (chunk) {
        chunks.push(chunk);
      }

      if (end >= text.length) {
        break;
      }

      start = end - overlap;
    }

    if (chunks.length > 1) {
      const last = chunks[chunks.length - 1];
      if (last.length < 800) {
        chunks[chunks.length - 2] = `${chunks[chunks.length - 2]}\n${last}`;
        chunks.pop();
      }
    }

    return chunks;
  }

  private async createPostChunks(post: IPost) {
    const text = [post.title, post.content].filter(Boolean).join("\n\n").trim();
    if (!text || !isAiEnabled()) {
      return;
    }

    const chunks = this.chunkText(text);
    await postEmbeddingModel.deleteMany({ postId: post._id.toString() });

    const documents: Partial<IPostEmbedding>[] = [];
    for (let index = 0; index < chunks.length; index += 1) {
      const chunkText = chunks[index];
      const embedding = await embedText(chunkText);
      if (!embedding) {
        continue;
      }
      documents.push({
        postId: post._id.toString(),
        chunkIndex: index,
        chunkText,
        embedding,
      });
    }

    if (documents.length > 0) {
      await postEmbeddingModel.insertMany(documents);
    }
  }

  async create(req: Request, res: Response) {
    try {
      req.body.sender = res.locals.userId;
      if (req.file?.filename) {
        req.body.postImage = `uploads/${process.env.POST_IMAGES_DIR || 'postImages'}/${req.file.filename}`;
      }
      if (req.body.postImage && typeof req.body.postImage !== 'string') {
        delete req.body.postImage;
      }

      const item = await this.model.create(req.body);
      await this.createPostChunks(item);
      res.status(201).send(item);
    } catch (error: any) {
      res.status(400).send(error.message ?? error);
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

      const updateBody: { [key: string]: any } = {};
      for (const field of this.getUpdateFields()) {
        if (req.body[field]) updateBody[field] = req.body[field];
      }

      const filter = { _id: req.params.id };
      const item = await this.model.findOneAndUpdate(filter, updateBody, { new: true });
      if (!item) {
        res.status(404).send("not found");
        return;
      }

      if (updateBody.title || updateBody.content) {
        await this.createPostChunks(item);
      }

      res.status(201).send(item);
    } catch (error: any) {
      res.status(400).send(error.message ?? error);
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

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a?.length || !b?.length || a.length !== b.length) {
      return -1;
    }
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    if (magA === 0 || magB === 0) return -1;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  async semanticSearch(req: Request, res: Response) {
    try {
      const query = (req.query.q as string || "").trim();
      if (!query) {
        return res.status(400).send({ message: "Query parameter 'q' is required for semantic search." });
      }

      if (!isAiEnabled()) {
        return res.status(503).send({ message: "Semantic search requires an active embedding provider (Hugging Face or OpenAI)." });
      }

      const queryEmbedding = await embedText(query);
      if (!queryEmbedding) {
        return res.status(500).send({ message: "Unable to generate query embedding." });
      }

      const chunks = await postEmbeddingModel.find({ embedding: { $exists: true } }).lean();
      const scored = chunks
        .map((chunk) => ({
          chunk,
          score: chunk.embedding ? this.cosineSimilarity(queryEmbedding, chunk.embedding) : -1,
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      const results = scored.map((item) => ({
        postId: item.chunk.postId,
        chunkIndex: item.chunk.chunkIndex,
        chunkText: item.chunk.chunkText,
        relevance: item.score,
      }));

      const answer = await answerFromChunks(query, results.map((item) => ({
        postId: item.postId,
        chunkIndex: item.chunkIndex,
        chunkText: item.chunkText,
      })));

      res.send({
        query,
        answer: answer ?? "No answer could be generated.",
        results,
      });
    } catch (error: any) {
      res.status(400).send({ message: error.message ?? error });
    }
  }

  getUpdateFields() {
    return ["title", "content", "likedBy", "postImage"];
  }
}

export default new PostsController();
