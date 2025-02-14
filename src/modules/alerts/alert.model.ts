import mongoose, { Schema, Document } from "mongoose";

export interface IAlert extends Document {
  userId: mongoose.Types.ObjectId;
  symbol: string;
  targetPrice: number;
  type: "ABOVE" | "BELOW";
  durationType: "ONCE" | "ONE_DAY" | "CONTINUOUS";
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
  triggeredAt?: Date;
  triggerCount: number;
  lastPrice: number;
  isThresholdPassed: boolean;
}

const AlertSchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
  },
  targetPrice: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["ABOVE", "BELOW"],
    required: true,
  },
  durationType: {
    type: String,
    enum: ["ONCE", "ONE_DAY", "CONTINUOUS"],
    required: true,
    default: "ONCE",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
  },
  triggeredAt: {
    type: Date,
  },
  triggerCount: {
    type: Number,
    default: 0,
  },
  lastPrice: {
    type: Number,
    default: 0,
  },
  isThresholdPassed: {
    type: Boolean,
    default: false,
  },
});

AlertSchema.index({ userId: 1, isActive: 1 });
AlertSchema.index({ symbol: 1, isActive: 1, isThresholdPassed: 1 });
AlertSchema.index({ durationType: 1, expiresAt: 1 });
AlertSchema.index({ createdAt: -1 });

export default mongoose.model<IAlert>("Alert", AlertSchema);
