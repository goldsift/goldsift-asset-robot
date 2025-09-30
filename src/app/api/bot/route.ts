import { NextResponse } from 'next/server';
import { TelegramBotService } from '@/services/telegram-bot.service';

export async function GET() {
  const botService = TelegramBotService.getInstance();
  const isRunning = botService.getStatus();

  return NextResponse.json({
    success: true,
    isRunning,
  });
}

export async function POST(request: Request) {
  const { action } = await request.json();
  const botService = TelegramBotService.getInstance();

  if (action === 'start') {
    const success = await botService.start();
    return NextResponse.json({
      success,
      message: success ? '机器人启动成功' : '机器人启动失败',
    });
  } else if (action === 'stop') {
    await botService.stop();
    return NextResponse.json({
      success: true,
      message: '机器人已停止',
    });
  } else if (action === 'restart') {
    // 重启 = 停止 + 启动
    await botService.stop();
    const success = await botService.start();
    return NextResponse.json({
      success,
      message: success ? '机器人重启成功' : '机器人重启失败',
    });
  } else {
    return NextResponse.json(
      {
        success: false,
        message: '无效的操作',
      },
      { status: 400 }
    );
  }
}