#!/usr/bin/env tsx
import { TelegramBotService } from '../src/services/telegram-bot.service';
import { GroupService } from '../src/services/group.service';
import { WatchlistService } from '../src/services/watchlist.service';
import { BinanceService } from '../src/services/binance.service';
import { ConfigService } from '../src/lib/config.service';

async function testBot() {
  console.log('开始测试机器人功能...\n');

  // 检查配置
  console.log('1. 检查配置');
  const botToken = ConfigService.getBotToken();
  const priceThreshold = ConfigService.getPriceThreshold();
  console.log(`   机器人 Token: ${botToken ? '已配置' : '未配置'}`);
  console.log(`   默认价格阈值: ${priceThreshold}%\n`);

  // 测试群组服务
  console.log('2. 测试群组服务');
  const groups = GroupService.getAllGroups();
  console.log(`   白名单群组数量: ${groups.length}`);
  if (groups.length > 0) {
    console.log(`   示例群组: ${groups[0].group_name} (${groups[0].group_id})`);
  }
  console.log();

  // 测试 Binance 价格服务
  console.log('3. 测试 Binance 价格服务');
  console.log('   获取 BTCUSDT 现货价格...');
  const btcPrice = await BinanceService.getAssetPrice('BTCUSDT', 'spot');
  console.log(`   BTCUSDT 价格: ${btcPrice ? `$${btcPrice}` : '获取失败'}\n`);

  // 测试关注列表服务
  console.log('4. 测试关注列表服务');
  const allWatchlists = WatchlistService.getAllWatchlists();
  console.log(`   总关注数量: ${allWatchlists.length}`);
  if (allWatchlists.length > 0) {
    console.log(`   示例: ${allWatchlists[0].asset_symbol} (${allWatchlists[0].asset_type})`);
  }
  console.log();

  // 测试机器人启动
  console.log('5. 测试机器人服务');
  const botService = TelegramBotService.getInstance();
  const isRunning = botService.getStatus();
  console.log(`   机器人状态: ${isRunning ? '运行中' : '未运行'}`);

  if (botToken && !isRunning) {
    console.log('   尝试启动机器人...');
    const started = await botService.start();
    console.log(`   启动结果: ${started ? '成功' : '失败'}`);

    if (started) {
      console.log('\n   机器人已启动!');
      console.log('   你现在可以在 Telegram 群组中使用以下命令:');
      console.log('   - /watch SYMBOL TYPE [THRESHOLD] - 添加关注');
      console.log('   - /list - 查看关注列表');
      console.log('   - /unwatch SYMBOL TYPE - 取消关注');
      console.log('\n   按 Ctrl+C 停止机器人');

      // 保持运行
      process.on('SIGINT', async () => {
        console.log('\n正在停止机器人...');
        await botService.stop();
        console.log('机器人已停止');
        process.exit(0);
      });
    }
  } else if (!botToken) {
    console.log('   ⚠️  请先在数据库中配置机器人 Token');
  }

  console.log('\n测试完成!');
}

testBot().catch((error) => {
  console.error('测试失败:', error);
  process.exit(1);
});