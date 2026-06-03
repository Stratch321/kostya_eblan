const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'myapp',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

// Проверяем соединение при старте
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌  Ошибка подключения к PostgreSQL:', err.message);
    process.exit(1);
  }
  release();
  console.log('✅  Подключено к PostgreSQL');
});

module.exports = pool;
