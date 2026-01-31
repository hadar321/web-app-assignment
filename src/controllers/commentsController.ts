import { Request, Response } from "express";
import CommentModel from "../models/commentsModel.js";
import { Types } from "mongoose";

const updateFields = ["content"];
const filterFields = ["postId", "sender"];

export const createComment = async (req: Request, res: Response) => {
  try {
    const comment = await CommentModel.create(req.body);

    return res.status(201).send(comment);
  } catch (error: any) {
    return res.status(500).send(error.message);
  }
};

export const getCommentById = async (req: Request, res: Response) => {
  const commentId = req.params.id;

  if (!commentId) {
    res.status(400).send("Comment Id is missing");
    return;
  }

  try {
    const comment = await CommentModel.findById(commentId);
    if (comment) {
      res.send(comment);
    } else {
      res.status(404).send("Comment not found");
    }
  } catch (error: any) {
    res.status(500).send(error.message);
  }
};

export const getAllComments = async (req: Request, res: Response) => {
  try {
    const filter: any = {};
    for (const field of filterFields) {
      if (req.query[field]) {
        // For postId, convert to ObjectId if provided
        if (field === "postId") {
          try {
            filter[field] = new Types.ObjectId(String(req.query[field]));
          } catch (e) {
            return res.status(400).send("Invalid postId");
          }
        } else {
          filter[field] = req.query[field];
        }
      }
    }

    const comments = await CommentModel.find(filter);
    res.send(comments);
  } catch (error: any) {
    res.status(400).send(error.message);
  }
};

export const updateComment = async (req: Request, res: Response) => {
  const commentId = req.params.id;
  const commentData: any = {};
  for (const field of updateFields) {
    if (req.body[field]) commentData[field] = req.body[field];
  }

  if (!commentId || Object.keys(commentData).length == 0) {
    res.status(400).send("Request required comment Id and updated comment");
    return;
  }

  try {
    const comment = await CommentModel.findByIdAndUpdate(commentId, commentData, { new: true });

    if (comment) {
      res.status(200).send(comment);
    } else {
      res.status(404).send("Comment not found");
    }
  } catch (error: any) {
    res.status(500).send(error.message);
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  const commentId = req.params.id;

  try {
    const comment = await CommentModel.findByIdAndDelete(commentId);

    if (comment) {
      res.status(200).send(comment);
    } else {
      res.status(404).send("Comment not found");
    }
  } catch (error: any) {
    res.status(400).send(error.message);
  }
};
