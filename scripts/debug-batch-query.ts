/**
 * 调试批量查询,看看为什么会返回593个价格
 */

import { BinanceService } from '../src/services/binance.service';

async function debugBatchQuery() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 调试批量查询');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 模拟3个标的
  const testAssets = [
    { symbol: 'BTCUSDT', assetType: 'spot' as const },
    { symbol: 'ETHUSDT', assetType: 'futures' as const },
    { symbol: 'BNBUSDT', assetType: 'alpha' as const },
  ];

  console.log('📋 测试资产列表 (3个):');
  testAssets.forEach((asset, i) => {
    console.log(`  ${i + 1}. ${asset.symbol} (${asset.assetType})`);
  });
  console.log();

  console.log('⏱️  开始批量查询...\n');

  try {
    const pricesMap = await BinanceService.getBatchAssetPrices(testAssets);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 结果: 获取到 ${pricesMap.size} 个价格`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n查询结果:');
    for (const [key, price] of pricesMap) {
      console.log(`  ${key}: $${price.toFixed(8)}`);
    }

  } catch (error) {
    console.error('❌ 查询失败:', error);
  }
}

debugBatchQuery();