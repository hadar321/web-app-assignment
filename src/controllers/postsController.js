import PostModel from "../models/postModel.js";


const updateFields = ["content", "title"];
const filterFields = ["sender"];

const getAllPosts = async (req, res) => {
  const sender = req.query.sender;

  try {
    const filter = {};
    for (const field of filterFields) {
      if (req.query[field]) filter[field] = req.query[field];
    }
    res.send(await PostModel.find(filter));
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const createPost = async (req, res) => {
  const postBody = req.body;

  try {
    const post = await PostModel.create(postBody);

    res.status(201).send(post);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const getPostById = async (req, res) => {
  const postId = req.params.id;

  try {
    const post = await PostModel.findById(postId);
    if (!post) {
      return res.status(404).send("Post not found");
    }
    res.status(200).send(post);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const getPostsBySender = async (req, res) => {
  const sender = req.query.sender;

  if (!sender) {
    return res.status(400).send("Sender parameter is required");
  }

  try {
    const posts = await PostModel.find({ publisher: sender });
    res.status(200).send(posts);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const updatePost = async (req, res) => {
  const postId = req.params.id;
  const postBody = {};
    for (const field of updateFields) {
      if (req.body[field]) postBody[field] = req.body[field];
    }

  if (!postId || Object.keys(postBody).length == 0) {
    res.status(400).send("Request required post Id and updated Post")
    return;
  }

  try {
    const post = await PostModel.findByIdAndUpdate(postId, postBody);

    if (post) {
      res.status(200).send(post);
    } else {
      res.status(404).send("Post not found");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

export {
  getAllPosts,
  createPost,
  getPostById,
  updatePost
};