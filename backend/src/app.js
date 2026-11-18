const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Enable CORS for mobile apps, standalone PWA, and browsers
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Monthly Budget Tracker Standalone App API',
    timestamp: new Date().toISOString()
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expenseRoutes);

// Serve Standalone iPhone PWA Static Bundle from backend/public
const publicDir = path.join(__dirname, '../public');
const indexHtmlPath = path.join(publicDir, 'index.html');

if (fs.existsSync(publicDir)) {
  app.use((req, res, next) => {
    if (req.path === '/sw.js' || req.path === '/manifest.json') {
      res.setHeader('Cache-Control', 'no-cache');
    }
    next();
  });

  app.use(express.static(publicDir));
}

// SPA Fallback for non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
  if (fs.existsSync(indexHtmlPath)) {
    return res.sendFile(indexHtmlPath);
  }
  return res.status(200).json({
    success: true,
    service: 'Monthly Budget Tracker REST API',
    status: 'online',
    version: '1.0.0'
  });
});

// Catch 404 for unknown /api routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
