import CommentModel from "../models/commentsModel.js";

const updateFields = ["content"];
const filterFields = ["postId", "sender"];

const createComment = async (req, res) => {
  try {
    const comment = await CommentModel.create(req.body);

    return res.status(201).send(comment);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

const getCommentById = async (req, res) => {
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
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getAllComments = async (req, res) => {
  try {
    const filter = {};
    for (const field of filterFields) {
      if (req.query[field]) filter[field] = req.query[field];
    }

    res.send(await CommentModel.find(filter));
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const updateComment = async (req, res) => {
  const commentId = req.params.id;
  const commentData = {};
    for (const field of updateFields) {
      if (req.body[field]) commentData[field] = req.body[field];
    }

  if (!commentId || Object.keys(commentData).length == 0) {
    res.status(400).send("Request required comment Id and updated comment");
    return;
  }

  try {
    const comment = await CommentModel.findByIdAndUpdate(
      commentId,
      commentData
    );

    if (comment) {
      res.status(200).send(comment);
    } else {
      res.status(404).send("Comment not found");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const deleteComment = async (req, res) => {
  const commentId = req.params.id;

  try {
    const comment = await CommentModel.findByIdAndDelete(commentId);

    if (comment) {
      res.status(200).send(comment);
    } else {
      res.status(404).send("Comment not found");
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export {
  createComment,
  getCommentById,
  getAllComments,
  updateComment,
  deleteComment,
};
