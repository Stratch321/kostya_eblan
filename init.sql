-- ============================================================
-- Миграция: создание таблиц users и sessions
-- Запуск: psql -U postgres -d myapp -f db/init.sql
-- ============================================================

-- Расширение для UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------
-- Таблица пользователей
-- ----------------------------
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Индекс для быстрого поиска по email
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Автоматически обновляем updated_at при изменении строки
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------
-- Таблица сессий (connect-pg-simple)
-- ----------------------------
CREATE TABLE IF NOT EXISTS session (
  sid    VARCHAR      NOT NULL PRIMARY KEY,
  sess   JSON         NOT NULL,
  expire TIMESTAMPTZ  NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_expire ON session (expire);
