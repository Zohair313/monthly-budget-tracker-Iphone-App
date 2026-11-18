const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateExpense, validateExpenseUpdate } = require('../middleware/validationMiddleware');

// All expense routes require valid JWT
router.use(authMiddleware);

// POST /api/expenses - Add a new expense
router.post('/', validateExpense, expenseController.addExpense);

// GET /api/expenses?month=&year=&category= - List expenses for a month
router.get('/', expenseController.getExpenses);

// PUT /api/expenses/:id - Edit an expense
router.put('/:id', validateExpenseUpdate, expenseController.editExpense);

// DELETE /api/expenses/:id - Delete an expense
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
