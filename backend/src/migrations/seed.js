const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seed() {
  console.log('🌱 Seeding initial demo data...');

  try {
    const demoEmail = 'demo@budgettracker.com';
    const demoPassword = 'password123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(demoPassword, salt);

    // 1. Create or fetch demo user
    let userResult = await db.query('SELECT * FROM users WHERE email = $1', [demoEmail]);
    let user;
    if (userResult.rows.length === 0) {
      const insertUser = await db.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
        ['Demo User', demoEmail, passwordHash]
      );
      user = insertUser.rows[0];
      console.log('👤 Created demo user:', user.email);
    } else {
      user = userResult.rows[0];
      console.log('👤 Demo user already exists:', user.email);
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // 2. Set monthly income (e.g. Rs. 100,000 as per OJT document)
    const incomeResult = await db.query(
      `INSERT INTO incomes (user_id, month, year, amount)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, month, year) DO UPDATE SET amount = EXCLUDED.amount
       RETURNING *`,
      [user.id, currentMonth, currentYear, 100000]
    );
    const income = incomeResult.rows[0];
    console.log(`💵 Set monthly income for ${currentMonth}/${currentYear}: Rs. ${income.amount}`);

    // 3. Add initial expenses (e.g. Electricity Bill - 8,000, Groceries - 15,000, Fuel - 7,000)
    const sampleExpenses = [
      { name: 'Electricity Bill', amount: 8000, category: 'Bills' },
      { name: 'Monthly Groceries', amount: 15000, category: 'Food' },
      { name: 'Car Fuel', amount: 7000, category: 'Travel' },
      { name: 'Internet Fiber', amount: 3500, category: 'Bills' }
    ];

    for (const item of sampleExpenses) {
      await db.query(
        `INSERT INTO expenses (user_id, income_id, name, amount, category, date)
         VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)`,
        [user.id, income.id, item.name, item.amount, item.category]
      );
      console.log(`   ➕ Added expense: ${item.name} (Rs. ${item.amount})`);
    }

    console.log('✅ Seeding complete!');
    console.log(`Demo login: ${demoEmail} / ${demoPassword}`);
  } catch (err) {
    console.error('❌ Seeding error:', err);
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
