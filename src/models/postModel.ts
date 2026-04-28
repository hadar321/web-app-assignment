import { Document, Schema, model } from "mongoose";

export interface IPost extends Document {
  title: string;
  content?: string;
  postImage?: string;
  sender: string;
  likedBy?: string[];
  embedding?: number[];
}

const postSchema = new Schema<IPost>({
  title: {
    type: String,
    required: true,
  },
 content: {
    type: String,
    required: true,
  },
  postImage: {
    type: String,
    required: false,
  },
  sender: {
    type: String,
    required: true,
  },
  likedBy: {
    type: [String],
    default: [],
  },
  embedding: {
    type: [Number],
    required: false,
  },
});

const postModel = model<IPost>("Posts", postSchema);

export default postModel;
