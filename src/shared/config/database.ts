import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);

    const collections = await conn.connection.db?.listCollections().toArray();
    console.log(
      "Available collections:",
      collections?.map((c) => c.name)
    );

    const usersCollection = conn.connection.db?.collection("users");
    const count = await usersCollection?.countDocuments();
    console.log("Number of documents in users collection:", count);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
