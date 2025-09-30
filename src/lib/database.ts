import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'database', 'asset-robot.db');
const SCHEMA_PATH = path.join(process.cwd(), 'database', 'schema.sql');
const SEED_PATH = path.join(process.cwd(), 'database', 'seed.sql');

let db: Database.Database | null = null;

/**
 * 获取数据库连接实例
 */
export function getDatabase(): Database.Database {
  if (!db) {
    // 确保数据库目录存在
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // 创建数据库连接
    db = new Database(DB_PATH);

    // 启用外键约束
    db.pragma('foreign_keys = ON');

    // 性能优化设置
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');

    console.log('✓ 数据库连接已建立:', DB_PATH);
  }

  return db;
}

/**
 * 初始化数据库（创建表结构）
 */
export function initializeDatabase(): void {
  const database = getDatabase();

  try {
    // 读取并执行 schema.sql
    if (fs.existsSync(SCHEMA_PATH)) {
      const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
      database.exec(schema);
      console.log('✓ 数据库表结构创建完成');
    } else {
      throw new Error(`Schema file not found: ${SCHEMA_PATH}`);
    }

    // 读取并执行 seed.sql
    if (fs.existsSync(SEED_PATH)) {
      const seed = fs.readFileSync(SEED_PATH, 'utf-8');
      database.exec(seed);
      console.log('✓ 数据库初始数据插入完成');
    } else {
      throw new Error(`Seed file not found: ${SEED_PATH}`);
    }
  } catch (error) {
    console.error('✗ 数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 检查数据库是否已初始化
 */
export function isDatabaseInitialized(): boolean {
  try {
    const database = getDatabase();
    const result = database.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='config'"
    ).get();
    return !!result;
  } catch (error) {
    return false;
  }
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('✓ 数据库连接已关闭');
  }
}

/**
 * 执行事务
 */
export function transaction<T>(fn: (db: Database.Database) => T): T {
  const database = getDatabase();
  const runTransaction = database.transaction(fn);
  return runTransaction(database);
}

// 导出类型
export type { Database };