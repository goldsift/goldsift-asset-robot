import type { AssetType } from '@/types/bot';

interface PriceCache {
  price: number;
  timestamp: number;
}

export class BinanceService {
  private static readonly CACHE_DURATION = 10 * 1000; // 10秒缓存
  private static priceCache = new Map<string, PriceCache>();

  // 合约全量价格缓存
  private static futuresAllPricesCache: {
    data: Map<string, number> | null;
    timestamp: number;
  } = {
    data: null,
    timestamp: 0,
  };

  /**
   * 获取币安现货价格
   */
  private static async getSpotPrice(symbol: string): Promise<number | null> {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`
      );
      if (!response.ok) {
        console.error(`获取现货价格失败: ${response.statusText}`);
        return null;
      }
      const data = await response.json();
      return parseFloat(data.price);
    } catch (error) {
      console.error('获取现货价格异常:', error);
      return null;
    }
  }

  /**
   * 获取币安合约价格
   */
  private static async getFuturesPrice(symbol: string): Promise<number | null> {
    try {
      const response = await fetch(
        `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol.toUpperCase()}`
      );
      if (!response.ok) {
        console.error(`获取合约价格失败: ${response.statusText}`);
        return null;
      }
      const data = await response.json();
      return parseFloat(data.price);
    } catch (error) {
      console.error('获取合约价格异常:', error);
      return null;
    }
  }

  /**
   * 获取 Alpha 标的价格（使用现货价格）
   */
  private static async getAlphaPrice(symbol: string): Promise<number | null> {
    return this.getSpotPrice(symbol);
  }

  /**
   * 获取资产价格（带缓存）
   */
  static async getAssetPrice(symbol: string, assetType: AssetType): Promise<number | null> {
    const cacheKey = `${assetType}:${symbol}`;
    const cached = this.priceCache.get(cacheKey);

    // 检查缓存
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.price;
    }

    // 获取新价格
    let price: number | null = null;
    switch (assetType) {
      case 'spot':
        price = await this.getSpotPrice(symbol);
        break;
      case 'futures':
        price = await this.getFuturesPrice(symbol);
        break;
      case 'alpha':
        price = await this.getAlphaPrice(symbol);
        break;
    }

    // 缓存价格
    if (price !== null) {
      this.priceCache.set(cacheKey, {
        price,
        timestamp: Date.now(),
      });
    }

    return price;
  }

  /**
   * 清除缓存
   */
  static clearCache(): void {
    this.priceCache.clear();
  }

  /**
   * 清除特定资产的缓存
   */
  static clearAssetCache(symbol: string, assetType: AssetType): void {
    const cacheKey = `${assetType}:${symbol}`;
    this.priceCache.delete(cacheKey);
  }

  /**
   * 批量获取现货价格
   * @param symbols 交易对数组，如 ["BTCUSDT", "ETHUSDT"]
   * @returns Map<symbol, price>
   */
  private static async getBatchSpotPrices(symbols: string[]): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (symbols.length === 0) return result;

    try {
      // URL编码的symbols参数: ["SYMBOL1","SYMBOL2"]
      const symbolsParam = encodeURIComponent(JSON.stringify(symbols.map(s => s.toUpperCase())));
      const url = `https://api.binance.com/api/v3/ticker/price?symbols=${symbolsParam}`;

      console.log(`  [现货] 查询 ${symbols.length} 个交易对:`, symbols.join(', '));

      const response = await fetch(url);

      if (!response.ok) {
        console.error(`批量获取现货价格失败: ${response.statusText}`);
        return result;
      }

      const data = await response.json();
      console.log(`  [现货] 返回 ${Array.isArray(data) ? data.length : 1} 个价格`);

      // 返回格式: [{"symbol":"BTCUSDT","price":"112892.27"}, ...]
      for (const item of data) {
        result.set(item.symbol, parseFloat(item.price));
      }

      return result;
    } catch (error) {
      console.error('批量获取现货价格异常:', error);
      return result;
    }
  }

  /**
   * 批量获取合约价格
   * 注意: 币安合约API不支持symbols参数批量查询
   * 策略: 一次性获取所有合约价格并缓存,然后筛选需要的
   * @param symbols 交易对数组，如 ["BTCUSDT", "ETHUSDT"]
   * @returns Map<symbol, price>
   */
  private static async getBatchFuturesPrices(symbols: string[]): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (symbols.length === 0) return result;

    try {
      // 检查全量缓存是否有效
      const now = Date.now();
      const cacheValid =
        this.futuresAllPricesCache.data !== null &&
        now - this.futuresAllPricesCache.timestamp < this.CACHE_DURATION;

      let allPrices: Map<string, number>;

      if (cacheValid) {
        console.log(`  [合约] 使用缓存的全量价格 (${this.futuresAllPricesCache.data!.size} 个)`);
        allPrices = this.futuresAllPricesCache.data!;
      } else {
        // 获取全量合约价格
        const url = `https://fapi.binance.com/fapi/v1/ticker/price`;

        console.log(`  [合约] 查询 ${symbols.length} 个交易对:`, symbols.join(', '));
        console.log(`  [合约] 注意: 合约API不支持批量查询,将获取全部价格后筛选`);

        const response = await fetch(url);

        if (!response.ok) {
          console.error(`批量获取合约价格失败: ${response.statusText}`);
          return result;
        }

        const data = await response.json();
        const totalPrices = Array.isArray(data) ? data.length : 1;

        // 构建全量价格Map
        allPrices = new Map();
        for (const item of data) {
          allPrices.set(item.symbol, parseFloat(item.price));
        }

        // 缓存全量价格
        this.futuresAllPricesCache = {
          data: allPrices,
          timestamp: now,
        };

        console.log(`  [合约] 获取全部 ${totalPrices} 个价格并缓存`);
      }

      // 转换为大写用于匹配
      const symbolsUpperCase = symbols.map(s => s.toUpperCase());

      // 筛选需要的交易对
      for (const symbol of symbolsUpperCase) {
        const price = allPrices.get(symbol);
        if (price !== undefined) {
          result.set(symbol, price);
        }
      }

      console.log(`  [合约] 从全部价格中筛选出 ${result.size}/${symbols.length} 个`);

      return result;
    } catch (error) {
      console.error('批量获取合约价格异常:', error);
      return result;
    }
  }

  /**
   * 批量获取资产价格（按类型分组查询）
   * @param assets 资产列表 [{ symbol, assetType }, ...]
   * @returns Map<"assetType:symbol", price>
   */
  static async getBatchAssetPrices(
    assets: Array<{ symbol: string; assetType: AssetType }>
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();

    // 按类型分组并去重
    const spotSymbols = new Set<string>();
    const futuresSymbols = new Set<string>();
    const alphaSymbols = new Set<string>();

    for (const { symbol, assetType } of assets) {
      const cacheKey = `${assetType}:${symbol}`;
      const cached = this.priceCache.get(cacheKey);

      // 检查缓存
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        result.set(cacheKey, cached.price);
        continue;
      }

      // 未命中缓存，添加到待查询列表
      if (assetType === 'spot') {
        spotSymbols.add(symbol.toUpperCase());
      } else if (assetType === 'futures') {
        futuresSymbols.add(symbol.toUpperCase());
      } else if (assetType === 'alpha') {
        alphaSymbols.add(symbol.toUpperCase());
      }
    }

    // 批量查询现货（包括alpha，因为alpha使用现货价格）
    const allSpotSymbols = Array.from(new Set([...spotSymbols, ...alphaSymbols]));
    if (allSpotSymbols.length > 0) {
      const spotPrices = await this.getBatchSpotPrices(allSpotSymbols);

      // 缓存并填充结果
      for (const [symbol, price] of spotPrices) {
        // 为spot类型缓存
        if (spotSymbols.has(symbol)) {
          const cacheKey = `spot:${symbol}`;
          this.priceCache.set(cacheKey, { price, timestamp: Date.now() });
          result.set(cacheKey, price);
        }
        // 为alpha类型缓存（使用相同的现货价格）
        if (alphaSymbols.has(symbol)) {
          const cacheKey = `alpha:${symbol}`;
          this.priceCache.set(cacheKey, { price, timestamp: Date.now() });
          result.set(cacheKey, price);
        }
      }
    }

    // 批量查询合约
    if (futuresSymbols.size > 0) {
      const futuresPrices = await this.getBatchFuturesPrices(Array.from(futuresSymbols));

      // 缓存并填充结果
      for (const [symbol, price] of futuresPrices) {
        const cacheKey = `futures:${symbol}`;
        this.priceCache.set(cacheKey, { price, timestamp: Date.now() });
        result.set(cacheKey, price);
      }
    }

    return result;
  }

  /**
   * 验证交易对是否存在
   * 如果未指定类型,按照现货->合约的顺序验证
   * @returns { valid: boolean, type: 'spot' | 'futures' | null, price: number | null }
   */
  static async validateSymbol(symbol: string, type?: 'spot' | 'futures'): Promise<{
    valid: boolean;
    type: 'spot' | 'futures' | null;
    price: number | null;
  }> {
    // 如果指定了类型,只验证该类型
    if (type) {
      const price = type === 'spot'
        ? await this.getSpotPrice(symbol)
        : await this.getFuturesPrice(symbol);

      return {
        valid: price !== null,
        type: price !== null ? type : null,
        price,
      };
    }

    // 未指定类型,先查现货
    const spotPrice = await this.getSpotPrice(symbol);
    if (spotPrice !== null) {
      return {
        valid: true,
        type: 'spot',
        price: spotPrice,
      };
    }

    // 现货查不到,查合约
    const futuresPrice = await this.getFuturesPrice(symbol);
    if (futuresPrice !== null) {
      return {
        valid: true,
        type: 'futures',
        price: futuresPrice,
      };
    }

    // 都查不到
    return {
      valid: false,
      type: null,
      price: null,
    };
  }
}