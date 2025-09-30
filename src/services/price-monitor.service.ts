import { WatchlistService } from './watchlist.service';
import { BinanceService } from './binance.service';
import { TelegramBotService } from './telegram-bot.service';
import { ConfigService } from '@/lib/config.service';
import { TimeService } from '@/lib/time.service';
import { getDatabase } from '@/lib/database';
import type { Watchlist } from '@/types/database';

interface PriceAlert {
  watchlist: Watchlist;
  oldPrice: number;
  newPrice: number;
  changePercent: number;
}

export class PriceMonitorService {
  /**
   * 执行价格监控检查（批量优化版本）
   */
  static async checkPrices(): Promise<void> {
    console.log('开始价格监控检查...');

    try {
      // 获取所有活跃的关注标的
      const watchlists = WatchlistService.getAllWatchlists();

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 关注标的统计');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`总数: ${watchlists.length}`);
      if (watchlists.length > 0) {
        watchlists.forEach((w, i) => {
          console.log(`${i + 1}. ${w.symbol} (${w.asset_type})`);
        });
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      if (watchlists.length === 0) {
        console.log('没有需要监控的标的');
        return;
      }

      console.log(`开始批量检查 ${watchlists.length} 个标的价格`);

      // 准备批量查询的资产列表
      const assets = watchlists.map(w => ({
        symbol: w.symbol,
        assetType: w.asset_type,
      }));

      // 批量获取所有价格（现货和合约各一次请求）
      const startTime = Date.now();
      const pricesMap = await BinanceService.getBatchAssetPrices(assets);
      const fetchTime = Date.now() - startTime;

      console.log(`✓ 批量获取价格完成，耗时: ${fetchTime}ms，获取到 ${pricesMap.size} 个价格`);

      const alerts: PriceAlert[] = [];

      // 检查每个标的的价格变动
      for (const watchlist of watchlists) {
        const cacheKey = `${watchlist.asset_type}:${watchlist.symbol}`;
        const currentPrice = pricesMap.get(cacheKey);

        if (currentPrice === undefined) {
          console.error(`无法获取 ${watchlist.symbol} 的价格`);
          continue;
        }

        // 计算价格变动百分比(始终与参考价格比较)
        const referencePrice = watchlist.reference_price;
        const changePercent = Math.abs(
          ((currentPrice - referencePrice) / referencePrice) * 100
        );

        // 获取价格阈值
        const threshold = watchlist.price_threshold || ConfigService.getPriceThreshold();

        // 检查是否超过阈值
        if (changePercent >= threshold) {
          // 检查提醒频率限制
          if (this.shouldAlert(watchlist)) {
            console.log(
              `${watchlist.symbol} 价格变动 ${changePercent.toFixed(2)}% (阈值: ${threshold}%)`
            );
            alerts.push({
              watchlist,
              oldPrice: referencePrice,
              newPrice: currentPrice,
              changePercent,
            });
          }
        }
      }

      // 发送提醒
      if (alerts.length > 0) {
        console.log(`检测到 ${alerts.length} 个价格变动提醒`);
        await this.sendAlerts(alerts);
      } else {
        console.log('未检测到需要提醒的价格变动');
      }
    } catch (error) {
      console.error('价格监控检查失败:', error);
    }
  }

  /**
   * 检查单个关注标的的价格
   */
  private static async checkWatchlistPrice(
    watchlist: Watchlist
  ): Promise<PriceAlert | null> {
    try {
      // 获取当前价格
      const currentPrice = await BinanceService.getAssetPrice(
        watchlist.symbol,
        watchlist.asset_type
      );

      if (currentPrice === null) {
        console.error(`无法获取 ${watchlist.symbol} 的价格`);
        return null;
      }

      // 计算价格变动百分比(始终与参考价格比较)
      const referencePrice = watchlist.reference_price;
      const changePercent = Math.abs(
        ((currentPrice - referencePrice) / referencePrice) * 100
      );

      // 获取价格阈值
      const threshold = watchlist.price_threshold || ConfigService.getPriceThreshold();

      // 检查是否超过阈值
      if (changePercent >= threshold) {
        // 检查提醒频率限制
        if (this.shouldAlert(watchlist)) {
          console.log(
            `${watchlist.symbol} 价格变动 ${changePercent.toFixed(2)}% (阈值: ${threshold}%)`
          );
          return {
            watchlist,
            oldPrice: referencePrice,
            newPrice: currentPrice,
            changePercent,
          };
        }
      }

      return null;
    } catch (error) {
      console.error(`检查 ${watchlist.symbol} 价格失败:`, error);
      return null;
    }
  }

  /**
   * 检查是否应该发送提醒（频率控制）
   */
  private static shouldAlert(watchlist: Watchlist): boolean {
    // 如果从未提醒过，可以提醒
    if (!watchlist.last_alert_at) {
      return true;
    }

    // 检查距离上次提醒的时间
    const alertInterval = ConfigService.getAlertInterval(); // 秒
    return TimeService.isBeforeSeconds(watchlist.last_alert_at, alertInterval);
  }

  /**
   * 发送价格提醒
   */
  private static async sendAlerts(alerts: PriceAlert[]): Promise<void> {
    const botService = TelegramBotService.getInstance();

    for (const alert of alerts) {
      try {
        const message = this.formatAlertMessage(alert);
        const success = await botService.sendMessageToGroup(
          alert.watchlist.group_id,
          message
        );

        if (success) {
          // 更新提醒记录
          this.updateAlertRecord(alert);
          console.log(`✓ 已发送提醒: ${alert.watchlist.symbol} -> 群组 ${alert.watchlist.group_id}`);
        } else {
          console.error(`✗ 发送提醒失败: ${alert.watchlist.symbol}`);
        }
      } catch (error) {
        console.error(`发送提醒异常:`, error);
      }
    }
  }

  /**
   * 格式化提醒消息
   */
  private static formatAlertMessage(alert: PriceAlert): string {
    const { watchlist, oldPrice, newPrice, changePercent } = alert;
    const direction = newPrice > oldPrice ? '📈 上涨' : '📉 下跌';
    const assetTypeName = this.getAssetTypeName(watchlist.asset_type);

    let message = `🔔 <b>价格变动提醒</b>\n\n`;
    message += `标的: <b>${watchlist.symbol}</b>\n`;
    message += `类型: ${assetTypeName}\n`;
    message += `━━━━━━━━━━━━\n`;
    message += `参考价格: $${oldPrice.toFixed(8)}\n`;
    message += `当前价格: $${newPrice.toFixed(8)}\n`;
    message += `变动幅度: ${direction} ${changePercent.toFixed(2)}%\n`;
    message += `━━━━━━━━━━━━\n`;
    message += `⏰ ${TimeService.format(TimeService.now())}`;

    return message;
  }

  /**
   * 更新提醒记录
   */
  private static updateAlertRecord(alert: PriceAlert): void {
    const db = getDatabase();
    try {
      const now = TimeService.now();

      // 更新关注列表中的提醒记录
      const stmt = db.prepare(
        'UPDATE watchlists SET last_alert_price = ?, last_alert_at = ? WHERE id = ?'
      );
      stmt.run(alert.newPrice, now, alert.watchlist.id);

      // 记录到提醒历史表
      const insertStmt = db.prepare(
        'INSERT INTO alert_history (watchlist_id, group_id, symbol, old_price, new_price, change_percent, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      );
      insertStmt.run(
        alert.watchlist.id,
        alert.watchlist.group_id,
        alert.watchlist.symbol,
        alert.oldPrice,
        alert.newPrice,
        alert.changePercent,
        this.formatAlertMessage(alert),
        now
      );
    } catch (error) {
      console.error('更新提醒记录失败:', error);
    }
  }

  /**
   * 获取资产类型中文名
   */
  private static getAssetTypeName(type: string): string {
    const names: Record<string, string> = {
      spot: '现货',
      futures: '合约',
      alpha: 'Alpha',
    };
    return names[type] || type;
  }
}