const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const http = require('http');
const db = require('../src/config/db');

let server;
let baseUrl;

test.before(async () => {
  db.resetMemoryStore();
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

// Helper for making JSON HTTP requests
async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

test('Health check endpoint', async () => {
  const res = await request('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'ok');
});

test('F1 - Register and Login (Authentication & JWT)', async (t) => {
  await t.test('Registers a new user successfully', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      }
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.ok(res.data.token);
    assert.equal(res.data.user.email, 'john@example.com');
  });

  await t.test('Rejects registration with duplicate email', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Another John',
        email: 'john@example.com',
        password: 'password456'
      }
    });

    assert.equal(res.status, 409);
    assert.equal(res.data.success, false);
  });

  await t.test('Rejects invalid registration inputs', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'J', email: 'not-an-email', password: '123' }
    });
    assert.equal(res.status, 400);
  });

  await t.test('Logs in user with valid credentials', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'john@example.com',
        password: 'password123'
      }
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(res.data.token);
  });

  await t.test('Rejects login with incorrect password', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'john@example.com',
        password: 'wrongpassword'
      }
    });

    assert.equal(res.status, 401);
  });
});

test('F2 & F8 - Monthly Income & Balance Calculations', async (t) => {
  // Login to get token
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'john@example.com', password: 'password123' }
  });
  const token = loginRes.data.token;
  const authHeader = { Authorization: `Bearer ${token}` };

  await t.test('Sets monthly income (e.g. Rs. 100,000 for month 11/2026)', async () => {
    const res = await request('/api/income', {
      method: 'POST',
      headers: authHeader,
      body: { month: 11, year: 2026, amount: 100000 }
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.summary.total_income, 100000);
    assert.equal(res.data.data.summary.total_expense, 0);
    assert.equal(res.data.data.summary.remaining_balance, 100000);
  });

  await t.test('Duplicate income updates instead of creating duplicate', async () => {
    const res = await request('/api/income', {
      method: 'POST',
      headers: authHeader,
      body: { month: 11, year: 2026, amount: 120000 }
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.data.summary.total_income, 120000);
    assert.equal(res.data.data.summary.remaining_balance, 120000);
  });

  await t.test('GET /api/income returns summary cards info', async () => {
    const res = await request('/api/income?month=11&year=2026', {
      headers: authHeader
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.data.summary.total_income, 120000);
    assert.equal(res.data.data.summary.remaining_balance, 120000);
  });
});

test('F3, F4, F5, F6, F7 - Expense CRUD and Auto Deduction', async (t) => {
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'john@example.com', password: 'password123' }
  });
  const token = loginRes.data.token;
  const authHeader = { Authorization: `Bearer ${token}` };

  // Set initial income to 100,000 as per OJT example
  await request('/api/income', {
    method: 'POST',
    headers: authHeader,
    body: { month: 11, year: 2026, amount: 100000 }
  });

  let expenseId;

  await t.test('F3 & F4 - Add Expense and Auto Deduction (100,000 - 8,000 = 92,000)', async () => {
    const res = await request('/api/expenses', {
      method: 'POST',
      headers: authHeader,
      body: {
        name: 'Electricity Bill',
        amount: 8000,
        category: 'Bills',
        month: 11,
        year: 2026
      }
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.equal(res.data.expense.amount, 8000);
    assert.equal(res.data.summary.total_income, 100000);
    assert.equal(res.data.summary.total_expense, 8000);
    assert.equal(res.data.summary.remaining_balance, 92000); // 100,000 - 8,000 = 92,000
    expenseId = res.data.expense.id;
  });

  await t.test('F5 - Lists expenses for the month', async () => {
    const res = await request('/api/expenses?month=11&year=2026', {
      headers: authHeader
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.count, 1);
    assert.equal(res.data.total_expense, 8000);
    assert.equal(res.data.expenses[0].name, 'Electricity Bill');
  });

  await t.test('F6 - Edit Expense recalculates balance correctly (8,000 -> 10,000 => balance 90,000)', async () => {
    const res = await request(`/api/expenses/${expenseId}`, {
      method: 'PUT',
      headers: authHeader,
      body: {
        name: 'Electricity Bill (Commercial)',
        amount: 10000
      }
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.expense.amount, 10000);
    assert.equal(res.data.summary.total_expense, 10000);
    assert.equal(res.data.summary.remaining_balance, 90000); // 100,000 - 10,000 = 90,000
  });

  await t.test('F7 - Delete Expense restores amount back to balance (balance back to 100,000)', async () => {
    const res = await request(`/api/expenses/${expenseId}`, {
      method: 'DELETE',
      headers: authHeader
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.summary.total_expense, 0);
    assert.equal(res.data.summary.remaining_balance, 100000); // Amount restored!
  });
});

test('Validation Rules & Warnings', async (t) => {
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'john@example.com', password: 'password123' }
  });
  const token = loginRes.data.token;
  const authHeader = { Authorization: `Bearer ${token}` };

  await t.test('Rejects expense with negative amount', async () => {
    const res = await request('/api/expenses', {
      method: 'POST',
      headers: authHeader,
      body: { name: 'Invalid', amount: -500, month: 11, year: 2026 }
    });
    assert.equal(res.status, 400);
  });

  await t.test('Rejects expense with zero amount', async () => {
    const res = await request('/api/expenses', {
      method: 'POST',
      headers: authHeader,
      body: { name: 'Free', amount: 0, month: 11, year: 2026 }
    });
    assert.equal(res.status, 400);
  });

  await t.test('Rejects expense with empty name', async () => {
    const res = await request('/api/expenses', {
      method: 'POST',
      headers: authHeader,
      body: { name: '   ', amount: 500, month: 11, year: 2026 }
    });
    assert.equal(res.status, 400);
  });

  await t.test('Generates balance warning when expense exceeds remaining balance', async () => {
    // Current balance is 100,000. Add expense of 150,000.
    const res = await request('/api/expenses', {
      method: 'POST',
      headers: authHeader,
      body: { name: 'Huge Expense', amount: 150000, month: 11, year: 2026 }
    });

    assert.equal(res.status, 201);
    assert.ok(res.data.warning);
    assert.equal(res.data.warning.exceeded, true);
    assert.equal(res.data.summary.remaining_balance, -50000);
  });

  await t.test('Protected endpoints reject unauthenticated requests', async () => {
    const res = await request('/api/income');
    assert.equal(res.status, 401);
  });
});
