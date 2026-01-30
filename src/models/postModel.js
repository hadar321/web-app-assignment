import { Schema, model } from "mongoose";

const postSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: String,
  publisher: {
    type: String,
    required: true,
  },
});

const postModel = model("Posts", postSchema);

export default postModel;