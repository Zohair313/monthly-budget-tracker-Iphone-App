const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateIncome } = require('../middleware/validationMiddleware');

// All income routes require valid JWT
router.use(authMiddleware);

// POST /api/income - Set or update monthly income
router.post('/', validateIncome, incomeController.setOrUpdateIncome);

// GET /api/income?month=&year= - Get income, total expense, remaining balance
router.get('/', incomeController.getIncomeAndBalance);

module.exports = router;
