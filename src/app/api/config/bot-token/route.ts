import { NextResponse } from 'next/server';
import { ConfigService } from '@/lib/config.service';
import { restartBotServices } from '@/lib/bot-lifecycle';

/**
 * GET /api/config/bot-token
 * 获取机器人 Token（脱敏处理）
 */
export async function GET() {
  try {
    const token = ConfigService.getBotToken();
    const maskedToken = token ? `${token.substring(0, 10)}...` : '';

    return NextResponse.json({
      token: maskedToken,
      isConfigured: !!token,
    });
  } catch (error) {
    console.error('获取机器人 Token 失败:', error);
    return NextResponse.json(
      { error: '获取机器人 Token 失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/config/bot-token
 * 设置机器人 Token，并自动重启机器人
 */
export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: '无效的 Token' },
        { status: 400 }
      );
    }

    ConfigService.setBotToken(token);

    // 自动重启机器人以应用新配置
    console.log('Bot Token已更新，正在重启机器人...');
    const restartResult = await restartBotServices();

    return NextResponse.json({
      success: true,
      message: '机器人 Token 已更新',
      botRestarted: restartResult.success,
      botMessage: restartResult.message,
    });
  } catch (error) {
    console.error('设置机器人 Token 失败:', error);
    return NextResponse.json(
      { error: '设置机器人 Token 失败' },
      { status: 500 }
    );
  }
}