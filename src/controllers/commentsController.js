import CommentModel from "../models/commentsModel.js";

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
  const postId = req.query.postId;

  try {
    const filter = {};
    if (postId) filter.postId = postId;

    const comments = await CommentModel.find(filter);
    res.send(comments);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const updateComment = async (req, res) => {
  const commentId = req.params.id;
  const comment = req.body;

  if (!commentId || !comment) {
    res.status(400).send("Request required comment Id and updated comment");
    return;
  }

  try {
    const comment = await CommentModel.findByIdAndUpdate(
      commentId,
      comment
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
