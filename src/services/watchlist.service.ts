import { getDatabase } from '@/lib/database';
import type { Watchlist, AssetType } from '@/types/database';

export class WatchlistService {
  /**
   * 添加或更新关注标的
   */
  static addWatchlist(
    groupId: string,
    assetSymbol: string,
    assetType: AssetType,
    referencePrice: number,
    addedBy: string,
    priceThreshold?: number
  ): { success: boolean; isUpdate: boolean } {
    const db = getDatabase();
    try {
      const threshold = priceThreshold || 5; // 默认 5%

      // 检查是否已存在
      const existing = db.prepare(
        'SELECT id FROM watchlists WHERE group_id = ? AND symbol = ? AND asset_type = ?'
      ).get(groupId, assetSymbol, assetType);

      if (existing) {
        // 已存在,执行更新
        const stmt = db.prepare(
          'UPDATE watchlists SET reference_price = ?, price_threshold = ?, updated_at = CURRENT_TIMESTAMP WHERE group_id = ? AND symbol = ? AND asset_type = ?'
        );
        stmt.run(referencePrice, threshold, groupId, assetSymbol, assetType);
        return { success: true, isUpdate: true };
      } else {
        // 不存在,执行插入
        const stmt = db.prepare(
          'INSERT INTO watchlists (group_id, symbol, asset_type, reference_price, price_threshold, added_by) VALUES (?, ?, ?, ?, ?, ?)'
        );
        stmt.run(groupId, assetSymbol, assetType, referencePrice, threshold, addedBy);
        return { success: true, isUpdate: false };
      }
    } catch (error) {
      console.error('添加/更新关注标的失败:', error);
      return { success: false, isUpdate: false };
    }
  }

  /**
   * 获取群组的关注列表
   */
  static getGroupWatchlists(groupId: string): Watchlist[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM watchlists WHERE group_id = ? ORDER BY created_at DESC');
    return stmt.all(groupId) as Watchlist[];
  }

  /**
   * 获取所有关注列表
   */
  static getAllWatchlists(): Watchlist[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM watchlists ORDER BY created_at DESC');
    return stmt.all() as Watchlist[];
  }

  /**
   * 移除关注标的
   */
  static removeWatchlist(groupId: string, assetSymbol: string, assetType: AssetType): boolean {
    const db = getDatabase();
    try {
      const stmt = db.prepare(
        'DELETE FROM watchlists WHERE group_id = ? AND symbol = ? AND asset_type = ?'
      );
      const result = stmt.run(groupId, assetSymbol, assetType);
      return result.changes > 0;
    } catch (error) {
      console.error('移除关注标的失败:', error);
      return false;
    }
  }

  /**
   * 更新参考价格
   */
  static updateReferencePrice(
    groupId: string,
    assetSymbol: string,
    assetType: AssetType,
    newPrice: number
  ): boolean {
    const db = getDatabase();
    try {
      const stmt = db.prepare(
        'UPDATE watchlists SET reference_price = ? WHERE group_id = ? AND symbol = ? AND asset_type = ?'
      );
      const result = stmt.run(newPrice, groupId, assetSymbol, assetType);
      return result.changes > 0;
    } catch (error) {
      console.error('更新参考价格失败:', error);
      return false;
    }
  }
}