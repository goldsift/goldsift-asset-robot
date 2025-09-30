/**
 * 系统常量配置
 */

// ============ 认证相关 ============
export const AUTH_COOKIE_NAME = 'auth-token';
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
export const JWT_EXPIRES_IN = '7d'; // Token 有效期 7 天
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 天（秒）

// ============ 密码相关 ============
export const MIN_PASSWORD_LENGTH = 6; // 最小密码长度
export const BCRYPT_SALT_ROUNDS = 10; // bcrypt 加密轮数

// ============ 缓存相关 ============
export const PRICE_CACHE_TTL = 10 * 1000; // 价格缓存时间 10 秒

// ============ 默认配置 ============
export const DEFAULT_PRICE_THRESHOLD = 5; // 默认价格阈值（百分比）
export const DEFAULT_CHECK_INTERVAL = 60; // 默认检查间隔（秒）
export const DEFAULT_ALERT_COOLDOWN = 300; // 默认提醒冷却时间（秒）
export const DEFAULT_BINANCE_API_URL = 'https://api.binance.com';

// ============ 数据库相关 ============
export const DEFAULT_ADMIN_USERNAME = 'admin';
export const DEFAULT_ADMIN_PASSWORD_HASH = '$2b$10$29fx68vvOwMTZrggLZ/3C.vWGKreXJTmYLWlQCIBDJxoxjKQFjvSq'; // admin123