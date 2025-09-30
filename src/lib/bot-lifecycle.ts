/**
 * 机器人生命周期管理
 * 支持动态启动、停止和重启机器人
 */

import { TelegramBotService } from '@/services/telegram-bot.service';
import { SchedulerService } from '@/services/scheduler.service';
import { PriceMonitorService } from '@/services/price-monitor.service';
import { ConfigService } from './config.service';

// 声明全局类型
declare global {
  var __botServicesInitialized: boolean | undefined;
}

// 使用 globalThis 确保跨模块共享状态
function getInitializedStatus(): boolean {
  return globalThis.__botServicesInitialized ?? false;
}

function setInitializedStatus(value: boolean): void {
  globalThis.__botServicesInitialized = value;
}

/**
 * 初始化机器人和监控服务
 * 如果没有配置Bot Token，不会启动，但也不会报错
 */
export async function initializeBotServices(): Promise<{ success: boolean; message: string }> {
  if (getInitializedStatus()) {
    console.log('机器人服务已初始化');
    return { success: true, message: '机器人服务已在运行中' };
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🤖 准备启动机器人服务...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 检查是否配置了Bot Token
  const botToken = ConfigService.getBotToken();
  if (!botToken) {
    console.log('⚠ 未配置Bot Token，机器人暂未启动');
    console.log('  请在管理后台配置Bot Token后，机器人将自动启动\n');
    return { success: false, message: '未配置Bot Token，请先在管理后台配置' };
  }

  try {
    // 启动电报机器人
    console.log('1. 启动电报机器人...');
    const botService = TelegramBotService.getInstance();
    const botStarted = await botService.start();

    if (!botStarted) {
      console.error('✗ 机器人启动失败，请检查Bot Token是否正确');
      return { success: false, message: '机器人启动失败，请检查Bot Token' };
    }
    console.log('✓ 电报机器人已启动\n');

    // 启动价格监控定时任务（每分钟执行一次）
    console.log('2. 启动价格监控任务...');
    const monitorInterval = 60 * 1000; // 1分钟
    SchedulerService.addTask('price-monitor', async () => {
      await PriceMonitorService.checkPrices();
    }, monitorInterval);
    console.log(`✓ 价格监控任务已启动（间隔: ${monitorInterval / 1000}秒）\n`);

    // 首次立即执行一次价格检查
    console.log('3. 执行首次价格检查...');
    setTimeout(async () => {
      await PriceMonitorService.checkPrices();
    }, 3000); // 延迟3秒，等待系统完全启动

    setInitializedStatus(true);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✓ 所有机器人服务已启动');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return { success: true, message: '机器人服务启动成功' };
  } catch (error) {
    console.error('✗ 机器人服务启动失败:', error);
    return { success: false, message: `启动失败: ${error}` };
  }
}

/**
 * 停止机器人服务
 */
export async function shutdownBotServices(): Promise<void> {
  console.log('\n正在停止机器人服务...');

  // 停止定时任务
  SchedulerService.stopAllTasks();
  console.log('✓ 定时任务已停止');

  // 停止机器人
  const botService = TelegramBotService.getInstance();
  await botService.stop();
  console.log('✓ 机器人已停止\n');

  setInitializedStatus(false);
}

/**
 * 重启机器人服务
 */
export async function restartBotServices(): Promise<{ success: boolean; message: string }> {
  console.log('\n正在重启机器人服务...');

  // 先停止
  await shutdownBotServices();

  // 等待一秒后重新启动
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 重新启动
  return await initializeBotServices();
}

/**
 * 获取初始化状态
 * 直接从服务实例获取真实状态,而不是依赖模块变量
 */
export function isBotServicesInitialized(): boolean {
  const botService = TelegramBotService.getInstance();
  const botRunning = botService.getStatus();
  const priceMonitorActive = SchedulerService.hasTask('price-monitor');

  // 只要机器人在运行或价格监控任务存在,就认为已初始化
  return botRunning || priceMonitorActive;
}