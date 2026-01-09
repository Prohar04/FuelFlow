import mongoose from "mongoose";
import config from "./env.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,

      // Fix for IPv4/IPv6 auto-selection issues that can show up as SSL alert 80
      autoSelectFamily: false,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
