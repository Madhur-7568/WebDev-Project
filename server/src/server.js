const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, closeDB, getDbMode } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
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
app.use('/api/venues', require('./routes/venueRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    database: 'PostgreSQL',
    dbMode: getDbMode(),
    timestamp: new Date().toISOString(),
    service: 'VAMS Smart Event Management API',
    version: '2.0.0'
  });
});

// Root API Greeting
app.get('/', (req, res) => {
  res.send(`<h1>VAMS PostgreSQL API is Running 🚀</h1><p>Database Mode: <b>${getDbMode()}</b></p><p>Visit <code>/api/events</code>, <code>/api/venues</code>, <code>/api/bookings</code>, or <code>/api/health</code></p>`);
});

// Error handling middleware
app.use(errorHandler);

// Initialize PostgreSQL and start Express server
const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`\n==================================================`);
      console.log(`🚀 VAMS Server running on: http://localhost:${PORT}`);
      console.log(`🐘 PostgreSQL Mode: ${getDbMode()}`);
      console.log(`📡 API Endpoints: http://localhost:${PORT}/api`);
      console.log(`==================================================\n`);
    });

    const shutdown = async () => {
      server.close();
      await closeDB();
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('❌ Failed to initialize PostgreSQL database:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
