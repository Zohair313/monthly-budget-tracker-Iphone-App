const db = require('../config/db');

/**
 * Helper to calculate dynamic balance and statistics for a given month and year
 * Critical Requirement: Balance is calculated on the fly as income minus SUM(expenses).
 * Never stored in the database!
 */
async function calculateMonthFinancials(userId, month, year) {
  // 1. Fetch current month income
  const incomeResult = await db.query(
    'SELECT * FROM incomes WHERE user_id = $1 AND month = $2 AND year = $3',
    [userId, month, year]
  );

  const incomeRow = incomeResult.rows[0] || null;
  const incomeId = incomeRow ? incomeRow.id : null;
  const totalIncome = incomeRow ? parseFloat(incomeRow.amount) : 0;

  // 2. Fetch total expenses for this income/month
  let totalExpense = 0;
  if (incomeId) {
    const expenseSumResult = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total_expense FROM expenses WHERE user_id = $1 AND income_id = $2',
      [userId, incomeId]
    );
    totalExpense = parseFloat(expenseSumResult.rows[0].total_expense) || 0;
  }

  // 3. Compute remaining balance
  const remainingBalance = totalIncome - totalExpense;

  // 4. Calculate burn rate & alert indicators
  const burnRate = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : (totalExpense > 0 ? 100 : 0);
  const isBudgetAlert = burnRate >= 80;
  const isOverBudget = remainingBalance < 0;

  // 5. Bonus: Previous month comparison
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  let prevTotalIncome = 0;
  let prevTotalExpense = 0;
  const prevIncomeResult = await db.query(
    'SELECT * FROM incomes WHERE user_id = $1 AND month = $2 AND year = $3',
    [userId, prevMonth, prevYear]
  );
  if (prevIncomeResult.rows.length > 0) {
    prevTotalIncome = parseFloat(prevIncomeResult.rows[0].amount) || 0;
    const prevExpenseSumResult = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total_expense FROM expenses WHERE user_id = $1 AND income_id = $2',
      [userId, prevIncomeResult.rows[0].id]
    );
    prevTotalExpense = parseFloat(prevExpenseSumResult.rows[0].total_expense) || 0;
  }

  const expenseChangeVsPrev = prevTotalExpense > 0 
    ? ((totalExpense - prevTotalExpense) / prevTotalExpense) * 100 
    : 0;

  return {
    income: incomeRow ? {
      id: incomeRow.id,
      month: incomeRow.month,
      year: incomeRow.year,
      amount: totalIncome,
      createdAt: incomeRow.created_at
    } : null,
    summary: {
      month: Number(month),
      year: Number(year),
      total_income: totalIncome,
      total_expense: totalExpense,
      remaining_balance: remainingBalance,
      burn_rate_percent: Math.round(burnRate * 10) / 10,
      is_budget_alert: isBudgetAlert,
      is_over_budget: isOverBudget,
      comparison_with_prev_month: {
        prev_month: prevMonth,
        prev_year: prevYear,
        prev_income: prevTotalIncome,
        prev_expense: prevTotalExpense,
        expense_change_percent: Math.round(expenseChangeVsPrev * 10) / 10
      }
    }
  };
}

/**
 * POST /api/income
 * Set or update income for a month (UPSERT)
 */
async function setOrUpdateIncome(req, res, next) {
  try {
    const userId = req.user.id;
    const { month, year, amount } = req.body;

    // PostgreSQL UPSERT with ON CONFLICT
    const upsertQuery = `
      INSERT INTO incomes (user_id, month, year, amount)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, month, year)
      DO UPDATE SET amount = EXCLUDED.amount
      RETURNING *;
    `;

    const result = await db.query(upsertQuery, [userId, month, year, amount]);
    const updatedIncome = result.rows[0];

    // Compute updated balance on the fly
    const financials = await calculateMonthFinancials(userId, month, year);

    return res.status(200).json({
      success: true,
      message: `Monthly income for ${month}/${year} set to Rs. ${amount.toLocaleString()}`,
      data: financials
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/income?month=&year=
 * Get income, total expense, and remaining balance
 */
async function getIncomeAndBalance(req, res, next) {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const month = req.query.month ? parseInt(req.query.month, 10) : currentDate.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year, 10) : currentDate.getFullYear();

    if (isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter month must be an integer between 1 and 12.'
      });
    }

    if (isNaN(year) || year < 2000) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter year must be a valid 4-digit year.'
      });
    }

    const financials = await calculateMonthFinancials(userId, month, year);

    return res.status(200).json({
      success: true,
      data: financials
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  setOrUpdateIncome,
  getIncomeAndBalance,
  calculateMonthFinancials
};
