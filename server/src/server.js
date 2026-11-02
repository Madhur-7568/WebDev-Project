const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database (dual-mode: MongoDB or built-in file/memory store)
connectDB();

// Middleware
app.use(cors({
  origin: '*', // Allow frontend dev server
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger (Development friendly)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'CampusSync Backend API',
    version: '1.0.0'
  });
});

// Root API Greeting
app.get('/', (req, res) => {
  res.send('<h1>CampusSync API is Running 🚀</h1><p>Visit <code>/api/events</code> or <code>/api/health</code></p>');
});

// Error handling middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 CampusSync Server is running on: http://localhost:${PORT}`);
  console.log(`📡 API Endpoints available at: http://localhost:${PORT}/api`);
  console.log(`🎓 WebDev Lab Project ready for team collaboration`);
  console.log(`==================================================\n`);
});

module.exports = app;
