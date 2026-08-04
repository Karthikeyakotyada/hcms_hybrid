const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.Mongodb_url || process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hems';
    const conn = await mongoose.connect(connStr);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // If local MongoDB is not running, log error but don't exit process so memory server fallback can be used if needed
  }
};

module.exports = connectDB;
