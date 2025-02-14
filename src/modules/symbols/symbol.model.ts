import mongoose, { Document, Schema } from "mongoose";

export interface ISymbol extends Document {
  symbol: string;
  createdAt: Date;
  updatedAt: Date;
}

const SymbolSchema: Schema = new Schema(
  {
    symbol: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISymbol>("Symbol", SymbolSchema);
