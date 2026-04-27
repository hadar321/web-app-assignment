import { Document, Schema, model } from "mongoose";

export interface IUser {
  username: string;
  email: string;
  password: string;
  profileImage?: string;
  _id?: string;
  refreshToken?: string[];
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  
  password: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
    required: false,
  },
  refreshToken: {
    type: [String],
    default: [],
  },
});

const userModel = model<IUser>("Users", userSchema);

export default userModel;
