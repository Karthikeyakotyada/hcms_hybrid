// Configure DNS servers BEFORE any networking or database modules load
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  console.warn('DNS initialization warning:', e.message);
}

const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const app = require('./app');
const seedInitialData = require('./utils/seed');

const PORT = process.env.PORT || 5000;

// Setup MongoDB connection event listeners
mongoose.connection.on('connected', () => {
  console.log('✓ MongoDB Connection established successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('✗ MongoDB Connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠ MongoDB Disconnected. Reconnecting...');
});

const connectWithRetry = async (uri, retries = 3, delayMs = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[MongoDB] Connecting to database (Attempt ${attempt}/${retries})...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 45000,
      });
      console.log('✓ [MongoDB] Connected successfully');
      return true;
    } catch (err) {
      console.error(`✗ [MongoDB] Connection attempt ${attempt} failed:`, err.message);
      if (attempt < retries) {
        console.log(`[MongoDB] Retrying in ${delayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  return false;
};

const startServer = async () => {
  try {
    const primaryUri = process.env.Mongodb_url || process.env.MONGODB_URL || process.env.MONGODB_URI;
    const localUri = 'mongodb://127.0.0.1:27017/hems';

    let isConnected = false;

    if (primaryUri) {
      isConnected = await connectWithRetry(primaryUri, 3, 2000);
    }

    if (!isConnected) {
      console.warn(`[MongoDB] Cloud Atlas connection failed. Attempting local MongoDB fallback (${localUri})...`);
      isConnected = await connectWithRetry(localUri, 1, 1000);
    }

    if (!isConnected) {
      console.error('CRITICAL: Could not connect to any MongoDB instance. Please check your internet connection or MongoDB Atlas IP whitelist.');
    } else {
      try {
        await seedInitialData();
      } catch (seedErr) {
        console.warn('Initial data seeding warning:', seedErr.message);
      }
    }

    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(` HEMS Backend Server running on port ${PORT}`);
      console.log(` API Endpoint: http://localhost:${PORT}/api`);
      console.log(` Database Status: ${isConnected ? 'CONNECTED' : 'DISCONNECTED (Check Network/Atlas)'}`);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('Fatal Server Startup Error:', error);
    process.exit(1);
  }
};

startServer();