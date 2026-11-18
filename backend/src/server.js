const app = require('./app');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(` Monthly Budget Tracker Backend API`);
  console.log(` Running on: http://localhost:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Database: ${process.env.DATABASE_URL ? 'Neon PostgreSQL' : 'In-Memory PostgreSQL Engine'}`);
  console.log(`===============================================`);
});
