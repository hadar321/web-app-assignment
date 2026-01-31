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

export { createComment, getCommentById, getAllComments };