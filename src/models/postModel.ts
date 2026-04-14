import { Document, Schema, model } from "mongoose";

export interface IPost extends Document {
  title: string;
  content?: string;
  sender: string;
  likedBy?: string[];
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
  sender: {
    type: String,
    required: true,
  },
  likedBy: {
    type: [String],
    default: [],
  },
  
});

const postModel = model<IPost>("Posts", postSchema);

export default postModel;
