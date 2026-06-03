/**
 * Middleware: requireAuth
 * Защищает маршруты — пропускает только авторизованных пользователей.
 * Использование:
 *   router.get('/profile', requireAuth, (req, res) => { ... });
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Необходима авторизация' });
}

module.exports = requireAuth;
