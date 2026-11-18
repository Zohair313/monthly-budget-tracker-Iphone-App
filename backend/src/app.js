const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Enable CORS for mobile apps, Expo Go, Web, and emulators
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Ignore favicon requests
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Monthly Budget Tracker REST API',
    status: 'online',
    version: '1.0.0',
    documentation: 'https://github.com/Zohair313/monthly-budget-tracker#readme',
    endpoints: {
      health: '/api/health',
      auth: ['POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/profile'],
      income: ['POST /api/income', 'GET /api/income?month=&year='],
      expenses: ['POST /api/expenses', 'GET /api/expenses?month=&year=', 'PUT /api/expenses/:id', 'DELETE /api/expenses/:id']
    }
  });
});

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Monthly Budget Tracker API',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expenseRoutes);

// Catch 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
