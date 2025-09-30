import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { ConfigService } from './config.service';
import { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_SALT_ROUNDS } from './constants';

interface SessionPayload {
  username: string;
  exp: number;
}

/**
 * 验证用户登录
 */
export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  try {
    const { username: adminUsername, password: adminPasswordHash } = ConfigService.getAdminCredentials();

    if (username !== adminUsername) {
      return false;
    }

    // 比较密码哈希
    const isValid = await bcrypt.compare(password, adminPasswordHash);
    return isValid;
  } catch (error) {
    console.error('验证凭据失败:', error);
    return false;
  }
}

/**
 * 创建 JWT Token
 */
export async function createToken(username: string): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);

  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(JWT_EXPIRES_IN)
    .setIssuedAt()
    .sign(secret);

  return token;
}

/**
 * 验证 JWT Token
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return {
      username: payload.username as string,
      exp: payload.exp as number
    };
  } catch (error) {
    console.error('验证 Token 失败:', error);
    return null;
  }
}

/**
 * 更新管理员密码
 */
export async function updateAdminPassword(newPassword: string): Promise<void> {
  const db = (await import('./database')).getDatabase();

  // 生成密码哈希
  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  // 更新数据库
  const stmt = db.prepare('UPDATE config SET value = ? WHERE key = ?');
  stmt.run(hashedPassword, 'admin_password');
}