const { Pool } = require('pg');
const dotenv = require('dotenv');
const crypto = require('crypto');
const path = require('path');

dotenv.config();
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
}

let pool = null;
let useMemoryStore = false;

// In-memory fallback store when DATABASE_URL is not set (e.g. offline dev / local testing)
const memoryStore = {
  users: [],
  incomes: [],
  expenses: [],
  nextIncomeId: 1,
  nextExpenseId: 1
};

if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
  const isNeon = process.env.DATABASE_URL.includes('neon.tech') || process.env.DATABASE_URL.includes('sslmode=require');
  
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isNeon ? { rejectUnauthorized: false } : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false)
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
  });
} else {
  useMemoryStore = true;
  console.log('ℹ️  No DATABASE_URL configured. Running with high-performance In-Memory PostgreSQL Store for development/testing.');
}

/**
 * Universal query runner supporting both Neon PostgreSQL and memory fallback
 */
async function query(text, params = []) {
  if (pool) {
    return pool.query(text, params);
  }

  // Memory driver handler for offline development & tests
  return executeMemoryQuery(text, params);
}

function executeMemoryQuery(text, params) {
  const sql = text.trim();
  const lower = sql.toLowerCase();

  // 1. SELECT * FROM users WHERE email = $1
  if (lower.startsWith('select') && lower.includes('from users') && lower.includes('where email = $1')) {
    const email = params[0].toLowerCase();
    const user = memoryStore.users.find(u => u.email.toLowerCase() === email);
    return { rows: user ? [user] : [] };
  }

  // 2. SELECT id, name, email FROM users WHERE id = $1
  if (lower.startsWith('select') && lower.includes('from users') && lower.includes('where id = $1')) {
    const id = params[0];
    const user = memoryStore.users.find(u => u.id === id);
    if (!user) return { rows: [] };
    const { password_hash, ...safeUser } = user;
    return { rows: [safeUser] };
  }

  // 3. INSERT INTO users
  if (lower.startsWith('insert into users')) {
    const [name, email, password_hash] = params;
    const existing = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      const err = new Error('duplicate key value violates unique constraint "users_email_key"');
      err.code = '23505';
      throw err;
    }
    const newUser = {
      id: crypto.randomUUID(),
      name,
      email: email.toLowerCase(),
      password_hash,
      created_at: new Date().toISOString()
    };
    memoryStore.users.push(newUser);
    return { rows: [newUser] };
  }

  // 4. Incomes queries
  if (lower.startsWith('select') && lower.includes('from incomes') && lower.includes('where user_id = $1 and month = $2 and year = $3')) {
    const [userId, month, year] = params;
    const inc = memoryStore.incomes.find(i => i.user_id === userId && Number(i.month) === Number(month) && Number(i.year) === Number(year));
    return { rows: inc ? [{ ...inc, amount: String(inc.amount) }] : [] };
  }

  if (lower.startsWith('select') && lower.includes('from incomes') && lower.includes('where id = $1')) {
    const [id] = params;
    const inc = memoryStore.incomes.find(i => Number(i.id) === Number(id));
    return { rows: inc ? [{ ...inc, amount: String(inc.amount) }] : [] };
  }

  // Upsert into incomes (ON CONFLICT DO UPDATE)
  if (lower.startsWith('insert into incomes')) {
    const [userId, month, year, amount] = params;
    const parsedAmount = Number(amount);
    let existingIndex = memoryStore.incomes.findIndex(
      i => i.user_id === userId && Number(i.month) === Number(month) && Number(i.year) === Number(year)
    );

    if (existingIndex >= 0) {
      memoryStore.incomes[existingIndex].amount = parsedAmount;
      return { rows: [{ ...memoryStore.incomes[existingIndex], amount: String(parsedAmount) }] };
    } else {
      const newIncome = {
        id: memoryStore.nextIncomeId++,
        user_id: userId,
        month: Number(month),
        year: Number(year),
        amount: parsedAmount,
        created_at: new Date().toISOString()
      };
      memoryStore.incomes.push(newIncome);
      return { rows: [{ ...newIncome, amount: String(parsedAmount) }] };
    }
  }

  // 5. Expenses sum query
  if (lower.startsWith('select') && lower.includes('sum(amount)') && lower.includes('from expenses')) {
    const [userId, incomeId] = params;
    const matching = memoryStore.expenses.filter(e => e.user_id === userId && Number(e.income_id) === Number(incomeId));
    const total = matching.reduce((sum, e) => sum + Number(e.amount), 0);
    return { rows: [{ total_expense: String(total) }] };
  }

  // 6. SELECT expenses for an income_id / month
  if (lower.startsWith('select') && lower.includes('from expenses') && lower.includes('income_id = $2')) {
    const [userId, incomeId] = params;
    let list = memoryStore.expenses.filter(e => e.user_id === userId && Number(e.income_id) === Number(incomeId));
    if (params.length > 2 && params[2]) {
      list = list.filter(e => e.category.toLowerCase() === params[2].toLowerCase());
    }
    list.sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);
    return { rows: list.map(e => ({ ...e, amount: String(e.amount) })) };
  }

  // 7. SELECT single expense
  if (lower.startsWith('select') && lower.includes('from expenses') && lower.includes('where id = $1 and user_id = $2')) {
    const [id, userId] = params;
    const item = memoryStore.expenses.find(e => Number(e.id) === Number(id) && e.user_id === userId);
    return { rows: item ? [{ ...item, amount: String(item.amount) }] : [] };
  }

  // 8. INSERT INTO expenses
  if (lower.startsWith('insert into expenses')) {
    const [userId, incomeId, name, amount, category, date] = params;
    const newExpense = {
      id: memoryStore.nextExpenseId++,
      user_id: userId,
      income_id: Number(incomeId),
      name,
      amount: Number(amount),
      category: category || 'General',
      date: date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    memoryStore.expenses.push(newExpense);
    return { rows: [{ ...newExpense, amount: String(newExpense.amount) }] };
  }

  // 9. UPDATE expenses
  if (lower.startsWith('update expenses')) {
    const [name, amount, category, date, id, userId] = params;
    const item = memoryStore.expenses.find(e => Number(e.id) === Number(id) && e.user_id === userId);
    if (!item) return { rows: [] };
    if (name !== undefined && name !== null) item.name = name;
    if (amount !== undefined && amount !== null) item.amount = Number(amount);
    if (category !== undefined && category !== null) item.category = category;
    if (date !== undefined && date !== null) item.date = date;
    return { rows: [{ ...item, amount: String(item.amount) }] };
  }

  // 10. DELETE FROM expenses
  if (lower.startsWith('delete from expenses')) {
    const [id, userId] = params;
    const index = memoryStore.expenses.findIndex(e => Number(e.id) === Number(id) && e.user_id === userId);
    if (index === -1) return { rows: [] };
    const [removed] = memoryStore.expenses.splice(index, 1);
    return { rows: [{ ...removed, amount: String(removed.amount) }] };
  }

  // Generic fallback
  return { rows: [] };
}

function resetMemoryStore() {
  memoryStore.users = [];
  memoryStore.incomes = [];
  memoryStore.expenses = [];
  memoryStore.nextIncomeId = 1;
  memoryStore.nextExpenseId = 1;
}

module.exports = {
  query,
  pool,
  useMemoryStore: () => useMemoryStore,
  resetMemoryStore,
  getMemoryStore: () => memoryStore
};
