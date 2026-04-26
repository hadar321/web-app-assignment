import { Document, Schema, model } from "mongoose";

export interface IPostEmbedding extends Document {
  postId: string;
  chunkIndex: number;
  chunkText: string;
  embedding: number[];
}

const postEmbeddingSchema = new Schema<IPostEmbedding>(
  {
    postId: {
      type: String,
      required: true,
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    chunkText: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
  },
  {
    collection: "postEmbeddings",
    timestamps: true,
  },
);

const postEmbeddingModel = model<IPostEmbedding>("PostEmbedding", postEmbeddingSchema);

export default postEmbeddingModel;
