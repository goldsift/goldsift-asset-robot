/**
 * 测试批量查询功能
 */

import { BinanceService } from '../src/services/binance.service';

async function testBatchQuery() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 测试批量查询功能');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 测试数据：混合现货、合约和alpha
  const testAssets = [
    { symbol: 'BTCUSDT', assetType: 'spot' as const },
    { symbol: 'ETHUSDT', assetType: 'spot' as const },
    { symbol: 'BNBUSDT', assetType: 'spot' as const },
    { symbol: 'BTCUSDT', assetType: 'futures' as const },
    { symbol: 'ETHUSDT', assetType: 'futures' as const },
    { symbol: 'SOLUSDT', assetType: 'alpha' as const },
    { symbol: 'XRPUSDT', assetType: 'alpha' as const },
  ];

  console.log('📋 测试资产列表:');
  testAssets.forEach((asset, i) => {
    console.log(`  ${i + 1}. ${asset.symbol} (${asset.assetType})`);
  });
  console.log();

  // 测试批量查询
  console.log('⏱️  开始批量查询...');
  const startTime = Date.now();

  try {
    const pricesMap = await BinanceService.getBatchAssetPrices(testAssets);
    const fetchTime = Date.now() - startTime;

    console.log(`✓ 批量查询完成！耗时: ${fetchTime}ms\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 查询结果:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const asset of testAssets) {
      const cacheKey = `${asset.assetType}:${asset.symbol}`;
      const price = pricesMap.get(cacheKey);

      if (price !== undefined) {
        console.log(`✓ ${cacheKey.padEnd(30)} $${price.toFixed(8)}`);
      } else {
        console.log(`✗ ${cacheKey.padEnd(30)} 查询失败`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 统计信息:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`总查询数: ${testAssets.length}`);
    console.log(`成功获取: ${testAssets.filter(a => pricesMap.has(`${a.assetType}:${a.symbol}`)).length}`);
    console.log(`失败数量: ${testAssets.filter(a => !pricesMap.has(`${a.assetType}:${a.symbol}`)).length}`);
    console.log(`总耗时: ${fetchTime}ms`);
    console.log(`平均耗时: ${(fetchTime / testAssets.length).toFixed(2)}ms/个`);

    // 测试缓存
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 测试缓存机制...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const cacheStartTime = Date.now();
    const cachedPricesMap = await BinanceService.getBatchAssetPrices(testAssets);
    const cacheTime = Date.now() - cacheStartTime;

    console.log(`✓ 缓存查询完成！耗时: ${cacheTime}ms`);
    console.log(`缓存命中: ${cachedPricesMap.size}/${testAssets.length}`);
    console.log(`加速比: ${(fetchTime / cacheTime).toFixed(2)}x`);

    console.log('\n✅ 测试完成！\n');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

testBatchQuery();