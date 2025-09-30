#!/usr/bin/env node

/**
 * 生成密码哈希的工具脚本
 */

import bcrypt from 'bcryptjs';

async function generatePasswordHash() {
  const password = process.argv[2] || 'admin123';
  const saltRounds = 10;

  const hash = await bcrypt.hash(password, saltRounds);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
}

generatePasswordHash().catch(console.error);