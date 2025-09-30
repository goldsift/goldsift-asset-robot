/**
 * 对比批量查询 vs 单个查询的性能
 */

import { BinanceService } from '../src/services/binance.service';

async function comparePerformance() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚡ 批量查询 vs 单个查询性能对比');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 测试数据
  const testAssets = [
    { symbol: 'BTCUSDT', assetType: 'spot' as const },
    { symbol: 'ETHUSDT', assetType: 'spot' as const },
    { symbol: 'BNBUSDT', assetType: 'spot' as const },
    { symbol: 'SOLUSDT', assetType: 'spot' as const },
    { symbol: 'XRPUSDT', assetType: 'spot' as const },
    { symbol: 'ADAUSDT', assetType: 'spot' as const },
    { symbol: 'DOGEUSDT', assetType: 'spot' as const },
    { symbol: 'AVAXUSDT', assetType: 'spot' as const },
    { symbol: 'LINKUSDT', assetType: 'spot' as const },
    { symbol: 'DOTUSDT', assetType: 'spot' as const },
    { symbol: 'BTCUSDT', assetType: 'futures' as const },
    { symbol: 'ETHUSDT', assetType: 'futures' as const },
    { symbol: 'BNBUSDT', assetType: 'futures' as const },
    { symbol: 'SOLUSDT', assetType: 'futures' as const },
    { symbol: 'XRPUSDT', assetType: 'futures' as const },
  ];

  console.log(`📋 测试规模: ${testAssets.length} 个交易对\n`);

  // 清空缓存
  BinanceService.clearCache();

  // 测试1: 单个查询（旧方法）
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🐌 方法1: 单个查询（优化前）');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const singleStartTime = Date.now();
  let singleSuccess = 0;

  for (const asset of testAssets) {
    try {
      const price = await BinanceService.getAssetPrice(asset.symbol, asset.assetType);
      if (price !== null) {
        singleSuccess++;
      }
    } catch (error) {
      console.error(`查询 ${asset.symbol} 失败`);
    }
  }

  const singleTime = Date.now() - singleStartTime;

  console.log(`✓ 完成！耗时: ${singleTime}ms`);
  console.log(`成功获取: ${singleSuccess}/${testAssets.length}`);
  console.log(`平均耗时: ${(singleTime / testAssets.length).toFixed(2)}ms/个\n`);

  // 等待一秒，避免API限制
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 清空缓存
  BinanceService.clearCache();

  // 测试2: 批量查询（新方法）
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 方法2: 批量查询（优化后）');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const batchStartTime = Date.now();
  const pricesMap = await BinanceService.getBatchAssetPrices(testAssets);
  const batchTime = Date.now() - batchStartTime;

  const batchSuccess = testAssets.filter(a =>
    pricesMap.has(`${a.assetType}:${a.symbol}`)
  ).length;

  console.log(`✓ 完成！耗时: ${batchTime}ms`);
  console.log(`成功获取: ${batchSuccess}/${testAssets.length}`);
  console.log(`平均耗时: ${(batchTime / testAssets.length).toFixed(2)}ms/个\n`);

  // 性能对比
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 性能对比总结');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`测试规模:       ${testAssets.length} 个交易对`);
  console.log(`单个查询耗时:   ${singleTime}ms`);
  console.log(`批量查询耗时:   ${batchTime}ms`);
  console.log(`性能提升:       ${(singleTime / batchTime).toFixed(2)}x`);
  console.log(`节省时间:       ${singleTime - batchTime}ms (${((1 - batchTime / singleTime) * 100).toFixed(1)}%)`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 优化效果分析');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`API请求次数:    ${testAssets.length} 次 → 2 次`);
  console.log(`请求减少:       ${testAssets.length - 2} 次 (${((1 - 2 / testAssets.length) * 100).toFixed(1)}%)`);
  console.log(`权重消耗:       ${testAssets.length * 2} → 8 (现货4+合约4)`);
  console.log(`权重节省:       ${testAssets.length * 2 - 8} (${((1 - 8 / (testAssets.length * 2)) * 100).toFixed(1)}%)`);

  console.log('\n✅ 测试完成！\n');
}

comparePerformance();