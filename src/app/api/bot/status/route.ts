/**
 * 机器人状态管理API
 */

import { NextResponse } from 'next/server';
import { TelegramBotService } from '@/services/telegram-bot.service';
import { SchedulerService } from '@/services/scheduler.service';
import { isBotServicesInitialized, initializeBotServices, shutdownBotServices, restartBotServices } from '@/lib/bot-lifecycle';

// GET - 获取机器人状态
export async function GET() {
  try {
    const botService = TelegramBotService.getInstance();
    const botStatus = botService.getStatus();
    const priceMonitorActive = SchedulerService.hasTask('price-monitor');
    const initialized = isBotServicesInitialized();

    console.log('[API] 状态查询:', {
      botStatus,
      priceMonitorActive,
      initialized,
      tasks: SchedulerService.getTaskIds()
    });

    return NextResponse.json({
      success: true,
      data: {
        initialized,
        botRunning: botStatus,
        priceMonitorActive,
        tasks: SchedulerService.getTaskIds(),
      },
    });
  } catch (error) {
    console.error('获取机器人状态失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取状态失败',
      },
      { status: 500 }
    );
  }
}

// POST - 控制机器人（启动/停止/重启）
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'start':
        const startResult = await initializeBotServices();
        return NextResponse.json({
          success: startResult.success,
          message: startResult.message,
        });

      case 'stop':
        await shutdownBotServices();
        return NextResponse.json({
          success: true,
          message: '机器人已停止',
        });

      case 'restart':
        const restartResult = await restartBotServices();
        return NextResponse.json({
          success: restartResult.success,
          message: restartResult.message,
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: '无效的操作，支持: start, stop, restart',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('控制机器人失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '操作失败',
      },
      { status: 500 }
    );
  }
}