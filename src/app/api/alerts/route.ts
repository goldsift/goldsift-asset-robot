import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

/**
 * 获取最新的提醒记录
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const db = getDatabase();

    // 获取最新的提醒记录,关联群组信息
    const stmt = db.prepare(`
      SELECT
        a.*,
        g.group_name as group_name
      FROM alert_history a
      LEFT JOIN groups g ON a.group_id = g.group_id
      ORDER BY a.sent_at DESC
      LIMIT ?
    `);

    const alerts = stmt.all(limit) as any[];

    return NextResponse.json({
      success: true,
      data: alerts.map(alert => ({
        id: alert.id,
        watchlist_id: alert.watchlist_id,
        group_id: alert.group_id,
        group_name: alert.group_name || '未知群组',
        symbol: alert.symbol,
        old_price: alert.old_price,
        new_price: alert.new_price,
        change_percent: alert.change_percent,
        message: alert.message,
        sent_at: alert.sent_at
      }))
    });
  } catch (error) {
    console.error('获取提醒记录失败:', error);
    return NextResponse.json(
      { success: false, message: '获取提醒记录失败' },
      { status: 500 }
    );
  }
}
