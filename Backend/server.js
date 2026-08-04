const app = require('./app');
const mongoose = require('mongoose');
const seedInitialData = require('./utils/seed');

const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    let connStr = process.env.Mongodb_url || process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hems';

    console.log(`Connecting to MongoDB at: ${connStr}`);

    try {
      await mongoose.connect(connStr, { serverSelectionTimeoutMS: 5000 });
      console.log('MongoDB Connected successfully');
      await seedInitialData();
    } catch (dbErr) {
      console.error(`Primary MongoDB Connection Failed (${dbErr.message}). Trying local fallback (mongodb://127.0.0.1:27017/hems)...`);
      try {
        const localConn = 'mongodb://127.0.0.1:27017/hems';
        await mongoose.connect(localConn, { serverSelectionTimeoutMS: 3000 });
        console.log('Local MongoDB Connected successfully');
        await seedInitialData();
      } catch (localErr) {
        console.error(`Local MongoDB Connection also failed: ${localErr.message}`);
      }
    }

    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(` HEMS Backend Server running on port ${PORT}`);
      console.log(` API Endpoint: http://localhost:${PORT}/api`);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('Fatal Server Startup Error:', error);
    process.exit(1);
  }
};

startServer();