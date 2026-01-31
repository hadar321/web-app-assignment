import { Document, Schema, model } from "mongoose";

export interface IPost extends Document {
  title: string;
  content?: string;
  sender: string;
}

const postSchema = new Schema<IPost>({
  title: {
    type: String,
    required: true,
  },
  content: String,
  sender: {
    type: String,
    required: true,
  },
  
});

const postModel = model<IPost>("Posts", postSchema);

export default postModel;
