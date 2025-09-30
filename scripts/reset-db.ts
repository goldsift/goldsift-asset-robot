#!/usr/bin/env node

/**
 * 数据库重置脚本
 * 警告：此操作将删除所有数据！
 */

import { closeDatabase } from '../src/lib/database';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'database', 'asset-robot.db');

async function main() {
  console.log('⚠️  警告：此操作将删除数据库及所有数据！');
  console.log('如需继续，请先关闭所有使用数据库的程序\n');

  try {
    // 关闭数据库连接
    closeDatabase();

    // 删除数据库文件
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
      console.log('✓ 数据库文件已删除');
    }

    // 删除 WAL 和 SHM 文件
    const walPath = `${DB_PATH}-wal`;
    const shmPath = `${DB_PATH}-shm`;

    if (fs.existsSync(walPath)) {
      fs.unlinkSync(walPath);
      console.log('✓ WAL 文件已删除');
    }

    if (fs.existsSync(shmPath)) {
      fs.unlinkSync(shmPath);
      console.log('✓ SHM 文件已删除');
    }

    console.log('\n✓ 数据库重置完成');
    console.log('请运行 npm run init:db 重新初始化数据库\n');
  } catch (error) {
    console.error('\n✗ 数据库重置失败:', error);
    process.exit(1);
  }
}

main();