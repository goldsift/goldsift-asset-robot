import { NextResponse } from 'next/server';
import { ConfigService } from '@/lib/config.service';

/**
 * GET /api/config/threshold
 * 获取价格阈值配置
 */
export async function GET() {
  try {
    const threshold = ConfigService.getPriceThreshold();
    const checkInterval = ConfigService.getCheckInterval();
    const alertCooldown = ConfigService.getAlertCooldown();

    return NextResponse.json({
      priceThreshold: threshold,
      checkInterval,
      alertCooldown,
    });
  } catch (error) {
    console.error('获取阈值配置失败:', error);
    return NextResponse.json(
      { error: '获取阈值配置失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/config/threshold
 * 更新价格阈值配置
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { priceThreshold, checkInterval, alertCooldown } = body;

    const updates: Record<string, string> = {};

    if (priceThreshold !== undefined) {
      const threshold = parseFloat(priceThreshold);
      if (isNaN(threshold) || threshold <= 0) {
        return NextResponse.json(
          { error: '价格阈值必须为正数' },
          { status: 400 }
        );
      }
      updates.price_threshold = threshold.toString();
    }

    if (checkInterval !== undefined) {
      const interval = parseInt(checkInterval, 10);
      if (isNaN(interval) || interval < 10) {
        return NextResponse.json(
          { error: '检查间隔不能小于10秒' },
          { status: 400 }
        );
      }
      updates.check_interval = interval.toString();
    }

    if (alertCooldown !== undefined) {
      const cooldown = parseInt(alertCooldown, 10);
      if (isNaN(cooldown) || cooldown < 60) {
        return NextResponse.json(
          { error: '提醒冷却时间不能小于60秒' },
          { status: 400 }
        );
      }
      updates.alert_cooldown = cooldown.toString();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: '没有需要更新的配置' },
        { status: 400 }
      );
    }

    ConfigService.setConfigs(updates);

    return NextResponse.json({
      success: true,
      message: '阈值配置已更新',
      data: updates,
    });
  } catch (error) {
    console.error('更新阈值配置失败:', error);
    return NextResponse.json(
      { error: '更新阈值配置失败' },
      { status: 500 }
    );
  }
}