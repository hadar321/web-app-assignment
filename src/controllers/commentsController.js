import CommentModel from "../models/commentsModel.js";

const createComment = async (req, res) => {
  try {
    const comment = await CommentModel.create(req.body);

    return res.status(201).send(comment);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

export { createComment };
