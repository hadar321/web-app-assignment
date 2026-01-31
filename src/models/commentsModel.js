import { Schema, model } from "mongoose";

const commentSchema = new Schema({
  postId: {
    type: Schema.Types.ObjectId,
    ref: "Posts",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  sender: { 
    type: String,
    required: true,
  },
});

const commentModel = model("Comments", commentSchema);

export default commentModel;
