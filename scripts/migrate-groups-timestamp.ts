/**
 * 数据库迁移脚本：将 groups 表的时间字段从 DATETIME 格式转换为 Unix 时间戳（秒）
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 数据库文件路径
const DB_PATH = path.join(process.cwd(), 'database', 'asset-robot.db');

console.log('开始迁移 groups 表的时间戳格式...\n');

if (!fs.existsSync(DB_PATH)) {
  console.error('❌ 数据库文件不存在:', DB_PATH);
  process.exit(1);
}

const db = new Database(DB_PATH);

try {
  // 开始事务
  db.exec('BEGIN TRANSACTION');

  console.log('1. 检查当前 groups 表结构...');
  const tableInfo = db.prepare('PRAGMA table_info(groups)').all();
  console.log('   当前字段:', tableInfo.map((col: any) => `${col.name} (${col.type})`).join(', '));

  // 读取现有数据
  console.log('\n2. 读取现有群组数据...');
  const existingGroups = db.prepare('SELECT * FROM groups').all();
  console.log(`   找到 ${existingGroups.length} 个群组`);

  if (existingGroups.length > 0) {
    console.log('\n3. 转换时间格式...');
    for (const group of existingGroups) {
      const createdAt = group.created_at;
      const updatedAt = group.updated_at;

      // 如果已经是数字类型（Unix 时间戳），跳过
      if (typeof createdAt === 'number' && createdAt < 9999999999) {
        console.log(`   ✓ 群组 ${group.group_name} 已经是 Unix 时间戳格式，跳过`);
        continue;
      }

      // 转换 DATETIME 字符串为 Unix 时间戳
      let createdTimestamp: number;
      let updatedTimestamp: number;

      if (typeof createdAt === 'string') {
        const createdDate = new Date(createdAt);
        createdTimestamp = Math.floor(createdDate.getTime() / 1000);
      } else {
        // 如果是毫秒时间戳，转换为秒
        createdTimestamp = Math.floor(createdAt / 1000);
      }

      if (typeof updatedAt === 'string') {
        const updatedDate = new Date(updatedAt);
        updatedTimestamp = Math.floor(updatedDate.getTime() / 1000);
      } else {
        updatedTimestamp = Math.floor(updatedAt / 1000);
      }

      console.log(`   - 群组: ${group.group_name}`);
      console.log(`     原始 created_at: ${createdAt} -> ${createdTimestamp}`);
      console.log(`     原始 updated_at: ${updatedAt} -> ${updatedTimestamp}`);
    }
  }

  // 创建新表
  console.log('\n4. 创建新的 groups 表...');
  db.exec(`
    DROP TABLE IF EXISTS groups_new;
    CREATE TABLE groups_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id TEXT NOT NULL UNIQUE,
      group_name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // 迁移数据
  if (existingGroups.length > 0) {
    console.log('\n5. 迁移数据到新表...');
    const insertStmt = db.prepare(`
      INSERT INTO groups_new (id, group_id, group_name, description, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const group of existingGroups) {
      let createdTimestamp: number;
      let updatedTimestamp: number;

      // 转换时间戳
      if (typeof group.created_at === 'string') {
        createdTimestamp = Math.floor(new Date(group.created_at).getTime() / 1000);
      } else if (group.created_at > 9999999999) {
        // 毫秒时间戳
        createdTimestamp = Math.floor(group.created_at / 1000);
      } else {
        // 已经是秒时间戳
        createdTimestamp = group.created_at;
      }

      if (typeof group.updated_at === 'string') {
        updatedTimestamp = Math.floor(new Date(group.updated_at).getTime() / 1000);
      } else if (group.updated_at > 9999999999) {
        updatedTimestamp = Math.floor(group.updated_at / 1000);
      } else {
        updatedTimestamp = group.updated_at;
      }

      insertStmt.run(
        group.id,
        group.group_id,
        group.group_name,
        group.description,
        group.is_active,
        createdTimestamp,
        updatedTimestamp
      );
    }
    console.log(`   ✓ 成功迁移 ${existingGroups.length} 条记录`);
  }

  // 替换旧表
  console.log('\n6. 替换旧表...');
  db.exec(`
    DROP TABLE groups;
    ALTER TABLE groups_new RENAME TO groups;
  `);

  // 重建索引
  console.log('\n7. 重建索引...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_groups_group_id ON groups(group_id);
  `);

  // 提交事务
  db.exec('COMMIT');

  console.log('\n✅ 迁移完成！');
  console.log('\n验证结果:');
  const newGroups = db.prepare('SELECT * FROM groups').all();
  for (const group of newGroups) {
    const date = new Date(group.created_at * 1000);
    console.log(`  - ${group.group_name}: ${group.created_at} (${date.toLocaleString('zh-CN')})`);
  }

} catch (error) {
  // 回滚事务
  db.exec('ROLLBACK');
  console.error('\n❌ 迁移失败:', error);
  process.exit(1);
} finally {
  db.close();
}
