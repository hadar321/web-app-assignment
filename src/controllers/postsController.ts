import { Request, Response } from "express";
import PostModel from "../models/postModel.js";

export const getAllPosts = async (req: Request, res: Response) => {
  const sender = req.query.sender as string | undefined;

  try {
    let posts;
    if (sender) {
      posts = await PostModel.find({ publisher: sender });
    } else {
      posts = await PostModel.find();
    }
    res.status(200).send(posts);
  } catch (error: any) {
    res.status(400).send(error.message);
  }
};

export const createPost = async (req: Request, res: Response) => {
  const postBody = req.body;

  try {
    const post = await PostModel.create(postBody);

    res.status(201).send(post);
  } catch (error: any) {
    res.status(400).send(error.message);
  }
};

export const getPostById = async (req: Request, res: Response) => {
  const postId = req.params.id;

  try {
    const post = await PostModel.findById(postId);
    if (!post) {
      return res.status(404).send("Post not found");
    }
    res.status(200).send(post);
  } catch (error: any) {
    res.status(400).send(error.message);
  }
};

export const updatePost = async (req: Request, res: Response) => {
  const postId = req.params.id;
  const updateBody = req.body;

  try {
    const post = await PostModel.findByIdAndUpdate(postId, updateBody, { new: true });
    if (!post) {
      return res.status(404).send("Post not found");
    }
    res.status(200).send(post);
  } catch (error: any) {
    res.status(400).send(error.message);
  }
};
