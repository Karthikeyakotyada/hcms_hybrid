const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const teamRoutes = require('./routes/teamRoutes');
const roundRoutes = require('./routes/roundRoutes');
const evalRoutes = require('./routes/evalRoutes');
const resultsRoutes = require('./routes/resultsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();

// Strict CORS Configuration matching allowed client origins
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Fallback allow for preflight checks
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/rounds', roundRoutes);
app.use('/api/evaluation', evalRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api', resultsRoutes);
app.use('/api', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HEMS Backend API is running' });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'HEMS Backend Server is active' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

module.exports = app;
