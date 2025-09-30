#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 用于首次创建数据库表结构和初始数据
 */

import { initializeDatabase, isDatabaseInitialized, closeDatabase } from '../src/lib/database';

async function main() {
  console.log('开始初始化数据库...\n');

  try {
    // 检查数据库是否已初始化
    if (isDatabaseInitialized()) {
      console.log('⚠ 数据库已存在，如需重新初始化请先删除 database/asset-robot.db 文件');
      process.exit(0);
    }

    // 初始化数据库
    initializeDatabase();

    console.log('\n✓ 数据库初始化成功！');
    console.log('\n默认管理员账号:');
    console.log('  用户名: admin');
    console.log('  密码: admin123');
    console.log('\n⚠ 建议首次登录后立即修改密码\n');
  } catch (error) {
    console.error('\n✗ 数据库初始化失败:', error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}

main();