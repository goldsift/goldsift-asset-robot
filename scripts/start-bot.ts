#!/usr/bin/env node

/**
 * 机器人启动脚本
 * 启动电报机器人并开启价格监控任务
 */

import { TelegramBotService } from '../src/services/telegram-bot.service';
import { SchedulerService } from '../src/services/scheduler.service';
import { PriceMonitorService } from '../src/services/price-monitor.service';

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🤖 智能标的电报机器人');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 启动电报机器人
    console.log('正在启动电报机器人...');
    const botService = TelegramBotService.getInstance();
    const botStarted = await botService.start();

    if (!botStarted) {
      console.error('✗ 机器人启动失败，请检查配置');
      process.exit(1);
    }

    console.log('✓ 电报机器人已启动\n');

    // 启动价格监控定时任务（每分钟执行一次）
    console.log('正在启动价格监控任务...');
    const monitorInterval = 60 * 1000; // 1分钟
    SchedulerService.addTask('price-monitor', async () => {
      await PriceMonitorService.checkPrices();
    }, monitorInterval);

    console.log(`✓ 价格监控任务已启动（间隔: ${monitorInterval / 1000}秒）\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✓ 所有服务已启动，机器人正在运行中...');
    console.log('  按 Ctrl+C 停止机器人');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 首次立即执行一次价格检查
    console.log('执行首次价格检查...\n');
    await PriceMonitorService.checkPrices();
  } catch (error) {
    console.error('\n✗ 启动失败:', error);
    process.exit(1);
  }
}

// 处理退出信号
process.on('SIGINT', async () => {
  console.log('\n\n正在停止服务...');

  // 停止定时任务
  SchedulerService.stopAllTasks();
  console.log('✓ 定时任务已停止');

  // 停止机器人
  const botService = TelegramBotService.getInstance();
  await botService.stop();
  console.log('✓ 机器人已停止');

  console.log('\n再见！\n');
  process.exit(0);
});

main();