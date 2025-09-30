import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { BinanceService } from '@/services/binance.service';

/**
 * 获取所有关注列表(带群组信息和当前价格)
 */
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();

    // 获取所有关注标的,并关联群组信息
    const stmt = db.prepare(`
      SELECT
        w.*,
        g.group_name as group_name
      FROM watchlists w
      LEFT JOIN groups g ON w.group_id = g.group_id
      ORDER BY w.created_at DESC
    `);

    const watchlists = stmt.all() as any[];

    // 获取当前价格
    const watchlistsWithPrices = await Promise.all(
      watchlists.map(async (item) => {
        let currentPrice = null;
        let priceChange = null;

        try {
          currentPrice = await BinanceService.getAssetPrice(item.symbol, item.asset_type);

          if (currentPrice && item.reference_price) {
            priceChange = ((currentPrice - item.reference_price) / item.reference_price) * 100;
          }
        } catch (error) {
          console.error(`获取 ${item.symbol} 价格失败:`, error);
        }

        return {
          id: item.id,
          chat_id: parseInt(item.group_id), // 兼容前端字段名
          group_name: item.group_name,
          symbol: item.symbol,
          type: item.asset_type,
          reference_price: item.reference_price,
          threshold: item.price_threshold,
          added_at: item.created_at,
          current_price: currentPrice,
          price_change: priceChange
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: watchlistsWithPrices
    });
  } catch (error) {
    console.error('获取关注列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取关注列表失败' },
      { status: 500 }
    );
  }
}

/**
 * 更新关注标的
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, reference_price, price_threshold } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少参数 id' },
        { status: 400 }
      );
    }

    if (reference_price === undefined && price_threshold === undefined) {
      return NextResponse.json(
        { success: false, message: '至少需要提供一个更新字段' },
        { status: 400 }
      );
    }

    // 验证数值范围
    if (reference_price !== undefined && reference_price <= 0) {
      return NextResponse.json(
        { success: false, message: '参考价格必须大于 0' },
        { status: 400 }
      );
    }

    if (price_threshold !== undefined && (price_threshold <= 0 || price_threshold > 100)) {
      return NextResponse.json(
        { success: false, message: '阈值必须在 0-100 之间' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 构建更新语句
    const updates: string[] = [];
    const params: any[] = [];

    if (reference_price !== undefined) {
      updates.push('reference_price = ?');
      params.push(reference_price);
    }

    if (price_threshold !== undefined) {
      updates.push('price_threshold = ?');
      params.push(price_threshold);
    }

    params.push(parseInt(id));

    const stmt = db.prepare(`UPDATE watchlists SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...params);

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, message: '关注标的不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新关注标的失败:', error);
    return NextResponse.json(
      { success: false, message: '更新失败' },
      { status: 500 }
    );
  }
}

/**
 * 删除关注标的
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少参数 id' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM watchlists WHERE id = ?');
    const result = stmt.run(parseInt(id));

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, message: '关注标的不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除关注标的失败:', error);
    return NextResponse.json(
      { success: false, message: '删除失败' },
      { status: 500 }
    );
  }
}