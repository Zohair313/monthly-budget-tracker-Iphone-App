function validateRegister(req, res, next) {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Name is required and must be at least 2 characters.'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: 'A valid email address is required.'
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long.'
    });
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required.'
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

function validateIncome(req, res, next) {
  let { month, year, amount } = req.body;

  month = parseInt(month, 10);
  year = parseInt(year, 10);
  const numAmount = parseFloat(amount);

  if (isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({
      success: false,
      error: 'Month must be an integer between 1 and 12.'
    });
  }

  if (isNaN(year) || year < 2000 || year > 2100) {
    return res.status(400).json({
      success: false,
      error: 'Year must be a valid 4-digit year (e.g. 2026).'
    });
  }

  if (isNaN(numAmount) || numAmount < 0) {
    return res.status(400).json({
      success: false,
      error: 'Income amount must be a non-negative number.'
    });
  }

  req.body.month = month;
  req.body.year = year;
  req.body.amount = numAmount;
  next();
}

function validateExpense(req, res, next) {
  let { name, amount, month, year, category, date } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Expense name is required and cannot be empty.'
    });
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Expense amount must be a positive number greater than zero.'
    });
  }

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  month = month !== undefined ? parseInt(month, 10) : currentMonth;
  year = year !== undefined ? parseInt(year, 10) : currentYear;

  if (isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({
      success: false,
      error: 'Month must be between 1 and 12.'
    });
  }

  if (isNaN(year) || year < 2000) {
    return res.status(400).json({
      success: false,
      error: 'Year must be valid.'
    });
  }

  req.body.name = name.trim();
  req.body.amount = numAmount;
  req.body.month = month;
  req.body.year = year;
  req.body.category = category ? String(category).trim() : 'General';
  req.body.date = date || new Date().toISOString().split('T')[0];

  next();
}

function validateExpenseUpdate(req, res, next) {
  const { name, amount } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Expense name cannot be empty.'
      });
    }
    req.body.name = name.trim();
  }

  if (amount !== undefined) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Expense amount must be a positive number greater than zero.'
      });
    }
    req.body.amount = numAmount;
  }

  if (req.body.category !== undefined) {
    req.body.category = String(req.body.category).trim();
  }

  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateIncome,
  validateExpense,
  validateExpenseUpdate
};
