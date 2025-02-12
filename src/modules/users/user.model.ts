import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
}

const UserSchema: Schema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    name: String,
    email: String,
    password: String,
  },
  {
    collection: "users",
  }
);

export default mongoose.model<IUser>("User", UserSchema, "users");
