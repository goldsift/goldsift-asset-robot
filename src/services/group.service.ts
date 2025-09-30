import { getDatabase } from '@/lib/database';
import type { Group } from '@/types/bot';

export class GroupService {
  /**
   * 检查群组是否在白名单中
   */
  static isGroupWhitelisted(groupId: string): boolean {
    const db = getDatabase();
    const stmt = db.prepare('SELECT id FROM groups WHERE group_id = ?');
    const result = stmt.get(groupId);
    return !!result;
  }

  /**
   * 根据 ID 获取群组
   */
  static getGroupById(groupId: string): Group | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM groups WHERE group_id = ?');
    const result = stmt.get(groupId) as Group | undefined;
    return result || null;
  }

  /**
   * 获取所有白名单群组
   */
  static getAllGroups(): Group[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM groups ORDER BY created_at DESC');
    return stmt.all() as Group[];
  }

  /**
   * 添加群组到白名单
   */
  static addGroup(params: { group_id: string; group_name: string; description?: string; is_active?: number }): boolean {
    const db = getDatabase();
    try {
      const stmt = db.prepare(
        'INSERT INTO groups (group_id, group_name, description, is_active) VALUES (?, ?, ?, ?)'
      );
      stmt.run(
        params.group_id,
        params.group_name,
        params.description || null,
        params.is_active ?? 1
      );
      return true;
    } catch (error) {
      console.error('添加群组失败:', error);
      return false;
    }
  }

  /**
   * 更新群组状态
   */
  static updateGroupStatus(groupId: string, isActive: number): boolean {
    const db = getDatabase();
    try {
      const stmt = db.prepare('UPDATE groups SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE group_id = ?');
      const result = stmt.run(isActive, groupId);
      return result.changes > 0;
    } catch (error) {
      console.error('更新群组状态失败:', error);
      return false;
    }
  }

  /**
   * 从白名单移除群组
   */
  static removeGroup(groupId: string): boolean {
    const db = getDatabase();
    try {
      const stmt = db.prepare('DELETE FROM groups WHERE group_id = ?');
      stmt.run(groupId);
      return true;
    } catch (error) {
      console.error('移除群组失败:', error);
      return false;
    }
  }
}