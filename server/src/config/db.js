/**
 * Database Connection Module
 * Supports dual-mode persistence: MongoDB (Mongoose) when available,
 * or seamless built-in file/in-memory data store for zero-setup ease.
 */
let isMongoConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.log('ℹ️  No MONGODB_URI configured. Running in Built-in Persistent DataStore mode (Zero setup required).');
    return false;
  }

  try {
    const mongoose = require('mongoose');
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}`);
    isMongoConnected = true;
    return true;
  } catch (error) {
    console.warn(`⚠️  MongoDB connection failed (${error.message}). Falling back to Built-in DataStore.`);
    isMongoConnected = false;
    return false;
  }
};

const getIsMongoConnected = () => isMongoConnected;

module.exports = {
  connectDB,
  getIsMongoConnected
};

