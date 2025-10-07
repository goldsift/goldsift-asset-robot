-- 配置表：存储系统配置信息
CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  is_sensitive INTEGER DEFAULT 0,  -- 是否为敏感字段（0: 否, 1: 是）
  is_editable INTEGER DEFAULT 1,   -- 是否可在前端编辑（0: 否, 1: 是）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 管理员表：存储后台管理员账号信息
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 群组表：白名单群组管理
CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id TEXT NOT NULL UNIQUE,
  group_name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,  -- Unix 时间戳（秒）
  updated_at INTEGER NOT NULL   -- Unix 时间戳（秒）
);

-- 用户表：记录使用机器人的用户
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 关注标的表：记录每个群组关注的标的
CREATE TABLE IF NOT EXISTS watchlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK(asset_type IN ('spot', 'futures', 'alpha')),
  reference_price REAL NOT NULL,
  price_threshold REAL,
  last_alert_price REAL,
  last_alert_at INTEGER,  -- Unix 时间戳（秒）
  added_by TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,  -- Unix 时间戳（秒）
  updated_at INTEGER NOT NULL,  -- Unix 时间戳（秒）
  UNIQUE(group_id, symbol, asset_type)
);

-- 价格历史表：记录价格变动历史
CREATE TABLE IF NOT EXISTS price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  price REAL NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  source TEXT DEFAULT 'binance'
);

-- 提醒历史表：记录所有发送的提醒
CREATE TABLE IF NOT EXISTS alert_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  watchlist_id INTEGER NOT NULL,
  group_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  old_price REAL NOT NULL,
  new_price REAL NOT NULL,
  change_percent REAL NOT NULL,
  message TEXT,
  created_at INTEGER NOT NULL  -- Unix 时间戳（秒）
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_groups_group_id ON groups(group_id);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_group_id ON watchlists(group_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_symbol ON watchlists(symbol);
CREATE INDEX IF NOT EXISTS idx_watchlists_active ON watchlists(is_active);
CREATE INDEX IF NOT EXISTS idx_price_history_symbol ON price_history(symbol);
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_alert_history_group_id ON alert_history(group_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_created_at ON alert_history(created_at);