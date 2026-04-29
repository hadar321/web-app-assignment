import { Document, Schema, model } from "mongoose";

export interface IPost extends Document {
  title: string;
  content?: string;
  postImage?: string;
  sender: any;
  likedBy?: string[];
  chunks?: { text: string; embedding: number[] }[];
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
    type: Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  likedBy: {
    type: [String],
    default: [],
  },
  chunks: [
    {
      text: { type: String, required: true },
      embedding: { type: [Number], required: true },
    }
  ],
});

const postModel = model<IPost>("Posts", postSchema);

export default postModel;
