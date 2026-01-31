import { Document, Schema, model, Types } from "mongoose";

export interface IComment extends Document {
  postId: Types.ObjectId;
  content: string;
  sender: string;
}

const commentSchema = new Schema<IComment>({
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

const commentModel = model<IComment>("Comments", commentSchema);

export default commentModel;
