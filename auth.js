const router  = require('express').Router();
const bcrypt  = require('bcrypt');
const pool    = require('../db/pool');

// ---------------------------------------------------------------------------
// POST /api/login
// Body: { email: string, password: string }
// ---------------------------------------------------------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // --- Базовая валидация входных данных ---
  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Некорректный формат email' });
  }

  try {
    // --- Ищем пользователя по email ---
    const { rows } = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    // Намеренно не уточняем, что именно неверно (email или пароль) —
    // это защита от перебора (user enumeration)
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const user = rows[0];

    // --- Проверяем пароль через bcrypt ---
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // --- Сохраняем данные пользователя в сессии ---
    req.session.userId = user.id;
    req.session.email  = user.email;

    return res.json({
      message: 'Вход выполнен успешно',
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error('Ошибка /login:', err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
