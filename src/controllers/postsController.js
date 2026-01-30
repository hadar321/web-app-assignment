import PostModel from "../models/postModel.js";

const createPost = async (req, res) => {
  const postBody = req.body;

  try {
    const post = await PostModel.create(postBody);

    res.status(201).send(post);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export {
  createPost
};