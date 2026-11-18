const db = require('../config/db');
const { calculateMonthFinancials } = require('./incomeController');

/**
 * Helper to ensure an income row exists for a (user_id, month, year)
 * Returns the income row (creates one with amount 0 if none exists yet)
 */
async function ensureIncomeExists(userId, month, year) {
  let incomeResult = await db.query(
    'SELECT * FROM incomes WHERE user_id = $1 AND month = $2 AND year = $3',
    [userId, month, year]
  );

  if (incomeResult.rows.length === 0) {
    incomeResult = await db.query(
      `INSERT INTO incomes (user_id, month, year, amount)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, month, year) DO NOTHING
       RETURNING *`,
      [userId, month, year, 0]
    );

    // If ON CONFLICT DO NOTHING hit due to race condition, re-select
    if (incomeResult.rows.length === 0) {
      incomeResult = await db.query(
        'SELECT * FROM incomes WHERE user_id = $1 AND month = $2 AND year = $3',
        [userId, month, year]
      );
    }
  }

  return incomeResult.rows[0];
}

/**
 * POST /api/expenses
 * Add a new expense
 */
async function addExpense(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, amount, month, year, category, date } = req.body;

    // 1. Link expense to month's income record
    const income = await ensureIncomeExists(userId, month, year);

    // 2. Fetch current financial status before adding expense (to check balance warning)
    const currentFinancials = await calculateMonthFinancials(userId, month, year);
    const currentRemaining = currentFinancials.summary.remaining_balance;

    // Check balance warning rule:
    // "Show a warning if the expense exceeds the remaining balance (the trainee decides whether to block or allow it, and documents the choice in the README)."
    // Decision: Allow the expense so users can record emergency/deficit spending, but return an explicit balance warning flag and message.
    let balanceWarning = null;
    if (amount > currentRemaining) {
      balanceWarning = {
        exceeded: true,
        message: `Warning: Expense (Rs. ${amount.toLocaleString()}) exceeds current remaining balance (Rs. ${currentRemaining.toLocaleString()}) by Rs. ${(amount - currentRemaining).toLocaleString()}.`,
        previous_balance: currentRemaining,
        projected_balance: currentRemaining - amount
      };
    }

    // 3. Insert expense
    const insertResult = await db.query(
      `INSERT INTO expenses (user_id, income_id, name, amount, category, date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, income.id, name, amount, category || 'General', date]
    );

    const newExpense = insertResult.rows[0];

    // 4. Auto Deduction / Dynamic Recalculation:
    // Balance is recalculated on the fly!
    const updatedFinancials = await calculateMonthFinancials(userId, month, year);

    return res.status(201).json({
      success: true,
      message: 'Expense added successfully!',
      expense: {
        id: newExpense.id,
        name: newExpense.name,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        date: newExpense.date,
        income_id: newExpense.income_id,
        createdAt: newExpense.created_at
      },
      warning: balanceWarning,
      summary: updatedFinancials.summary
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/expenses?month=&year=&category=
 * List all expenses for a month
 */
async function getExpenses(req, res, next) {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const month = req.query.month ? parseInt(req.query.month, 10) : currentDate.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year, 10) : currentDate.getFullYear();
    const category = req.query.category ? String(req.query.category).trim() : null;

    if (isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        error: 'Month query parameter must be an integer between 1 and 12.'
      });
    }

    if (isNaN(year) || year < 2000) {
      return res.status(400).json({
        success: false,
        error: 'Year query parameter must be a valid 4-digit year.'
      });
    }

    // Find the income for this month/year
    const incomeResult = await db.query(
      'SELECT * FROM incomes WHERE user_id = $1 AND month = $2 AND year = $3',
      [userId, month, year]
    );

    if (incomeResult.rows.length === 0) {
      return res.status(200).json({
        success: true,
        month,
        year,
        count: 0,
        total_expense: 0,
        category_breakdown: {},
        expenses: []
      });
    }

    const incomeId = incomeResult.rows[0].id;

    // Fetch expenses
    let expenseRows;
    if (category) {
      const result = await db.query(
        `SELECT * FROM expenses 
         WHERE user_id = $1 AND income_id = $2 AND LOWER(category) = LOWER($3)
         ORDER BY date DESC, id DESC`,
        [userId, incomeId, category]
      );
      expenseRows = result.rows;
    } else {
      const result = await db.query(
        `SELECT * FROM expenses 
         WHERE user_id = $1 AND income_id = $2
         ORDER BY date DESC, id DESC`,
        [userId, incomeId]
      );
      expenseRows = result.rows;
    }

    const expenses = expenseRows.map(e => ({
      id: e.id,
      name: e.name,
      amount: parseFloat(e.amount),
      category: e.category,
      date: e.date,
      income_id: e.income_id,
      createdAt: e.created_at
    }));

    // Calculate category breakdown
    const categoryBreakdown = {};
    let total = 0;
    for (const exp of expenses) {
      total += exp.amount;
      categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + exp.amount;
    }

    return res.status(200).json({
      success: true,
      month,
      year,
      count: expenses.length,
      total_expense: total,
      category_breakdown: categoryBreakdown,
      expenses
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/expenses/:id
 * Edit an expense
 */
async function editExpense(req, res, next) {
  try {
    const userId = req.user.id;
    const expenseId = parseInt(req.params.id, 10);
    const { name, amount, category, date } = req.body;

    if (isNaN(expenseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid expense ID parameter.'
      });
    }

    // Verify ownership and get existing expense
    const existing = await db.query(
      'SELECT * FROM expenses WHERE id = $1 AND user_id = $2',
      [expenseId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found or unauthorized to modify.'
      });
    }

    const currentExpense = existing.rows[0];

    // Update expense fields
    const updatedName = name !== undefined ? name : currentExpense.name;
    const updatedAmount = amount !== undefined ? amount : currentExpense.amount;
    const updatedCategory = category !== undefined ? category : currentExpense.category;
    const updatedDate = date !== undefined ? date : currentExpense.date;

    const updateResult = await db.query(
      `UPDATE expenses 
       SET name = $1, amount = $2, category = $3, date = $4 
       WHERE id = $5 AND user_id = $6 
       RETURNING *`,
      [updatedName, updatedAmount, updatedCategory, updatedDate, expenseId, userId]
    );

    const updatedExpense = updateResult.rows[0];

    // Find the associated income to recalculate balance
    const incomeResult = await db.query(
      'SELECT month, year FROM incomes WHERE id = $1',
      [updatedExpense.income_id]
    );

    let updatedSummary = null;
    if (incomeResult.rows.length > 0) {
      const { month, year } = incomeResult.rows[0];
      const financials = await calculateMonthFinancials(userId, month, year);
      updatedSummary = financials.summary;
    }

    return res.status(200).json({
      success: true,
      message: 'Expense updated successfully!',
      expense: {
        id: updatedExpense.id,
        name: updatedExpense.name,
        amount: parseFloat(updatedExpense.amount),
        category: updatedExpense.category,
        date: updatedExpense.date,
        income_id: updatedExpense.income_id,
        createdAt: updatedExpense.created_at
      },
      summary: updatedSummary
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/expenses/:id
 * Delete an expense
 * Requirement: Deleting an expense automatically adds the amount back to the balance.
 */
async function deleteExpense(req, res, next) {
  try {
    const userId = req.user.id;
    const expenseId = parseInt(req.params.id, 10);

    if (isNaN(expenseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid expense ID parameter.'
      });
    }

    // Verify ownership and get income_id
    const existing = await db.query(
      'SELECT * FROM expenses WHERE id = $1 AND user_id = $2',
      [expenseId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found or unauthorized to delete.'
      });
    }

    const target = existing.rows[0];

    // Delete the expense
    await db.query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2',
      [expenseId, userId]
    );

    // Dynamic balance is automatically updated because it computes income - SUM(expenses)!
    const incomeResult = await db.query(
      'SELECT month, year FROM incomes WHERE id = $1',
      [target.income_id]
    );

    let updatedSummary = null;
    if (incomeResult.rows.length > 0) {
      const { month, year } = incomeResult.rows[0];
      const financials = await calculateMonthFinancials(userId, month, year);
      updatedSummary = financials.summary;
    }

    return res.status(200).json({
      success: true,
      message: `Expense "${target.name}" of Rs. ${parseFloat(target.amount).toLocaleString()} deleted successfully. Amount restored to balance.`,
      deletedExpense: {
        id: target.id,
        name: target.name,
        amount: parseFloat(target.amount)
      },
      summary: updatedSummary
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  addExpense,
  getExpenses,
  editExpense,
  deleteExpense
};
