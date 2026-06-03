// Загружаем переменные окружения из .env
require('dotenv').config();

const express        = require('express');
const session        = require('express-session');
const pgSession      = require('connect-pg-simple')(session);
const path           = require('path');
const pool           = require('./db/pool');
const authRouter     = require('./routes/auth');
const requireAuth    = require('./middleware/requireAuth');

const app  = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// Парсим JSON и URL-encoded тела запросов
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы (HTML, CSS, JS фронтенда)
app.use(express.static(path.join(__dirname, 'public')));

// Сессии — хранятся в таблице session в PostgreSQL
app.use(session({
  store: new pgSession({
    pool,                         // Используем общий пул соединений
    tableName: 'session',         // Имя таблицы из db/init.sql
    pruneSessionInterval: 60 * 60 // Удаляем устаревшие сессии каждый час
  }),
  secret:            process.env.SESSION_SECRET || 'fallback_dev_secret',
  resave:            false,   // Не пересохраняем сессию, если она не изменилась
  saveUninitialized: false,   // Не создаём пустые сессии
  cookie: {
    httpOnly: true,   // JS на фронтенде не может прочитать куки
    secure:   process.env.NODE_ENV === 'production', // HTTPS только в prod
    maxAge:   1000 * 60 * 60 * 24 * 7 // 7 дней
  }
}));

// ---------------------------------------------------------------------------
// Маршруты
// ---------------------------------------------------------------------------

// Публичные API: регистрация и вход
app.use('/api/auth', authRouter);

// Пример защищённого маршрута
app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [req.session.userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error('Ошибка /api/me:', err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Выход — уничтожаем сессию
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Ошибка при выходе:', err);
      return res.status(500).json({ error: 'Не удалось завершить сессию' });
    }
    res.clearCookie('connect.sid');
    return res.json({ message: 'Выход выполнен' });
  });
});

// Все остальные GET-запросы отдаём index.html (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---------------------------------------------------------------------------
// Запуск сервера
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀  Сервер запущен: http://localhost:${PORT}`);
});
