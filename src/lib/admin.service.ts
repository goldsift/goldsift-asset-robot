import { getDatabase } from './database';

export interface Admin {
  id: number;
  username: string;
  password: string;
  created_at: string;
  updated_at: string;
}

/**
 * 管理员服务类
 */
export class AdminService {
  /**
   * 根据用户名获取管理员
   */
  static getAdminByUsername(username: string): Admin | null {
    const db = getDatabase();
    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as Admin | undefined;
    return admin || null;
  }

  /**
   * 更新管理员密码
   */
  static updatePassword(username: string, newPasswordHash: string): void {
    const db = getDatabase();
    db.prepare('UPDATE admins SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?')
      .run(newPasswordHash, username);
  }

  /**
   * 创建管理员
   */
  static createAdmin(username: string, passwordHash: string): void {
    const db = getDatabase();
    db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)')
      .run(username, passwordHash);
  }
}