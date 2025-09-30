import { getDatabase } from './database';
import type { Config } from '@/types/database';

/**
 * 配置服务类
 */
export class ConfigService {
  /**
   * 获取所有配置
   */
  static getAllConfigs(): Config[] {
    const db = getDatabase();
    const configs = db.prepare('SELECT * FROM config ORDER BY key').all() as Config[];
    return configs;
  }

  /**
   * 根据 key 获取配置值
   */
  static getConfig(key: string): string | null {
    const db = getDatabase();
    const config = db.prepare('SELECT value FROM config WHERE key = ?').get(key) as { value: string } | undefined;
    return config?.value || null;
  }

  /**
   * 获取多个配置
   */
  static getConfigs(keys: string[]): Record<string, string> {
    const db = getDatabase();
    const placeholders = keys.map(() => '?').join(',');
    const configs = db.prepare(`SELECT key, value FROM config WHERE key IN (${placeholders})`).all(...keys) as Config[];

    return configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);
  }

  /**
   * 设置配置值
   */
  static setConfig(key: string, value: string, description?: string): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO config (key, value, description, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        description = COALESCE(excluded.description, description),
        updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(key, value, description || null);
  }

  /**
   * 批量设置配置
   */
  static setConfigs(configs: Record<string, string>): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO config (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `);

    const transaction = db.transaction(() => {
      for (const [key, value] of Object.entries(configs)) {
        stmt.run(key, value);
      }
    });

    transaction();
  }

  /**
   * 删除配置
   */
  static deleteConfig(key: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM config WHERE key = ?').run(key);
  }

  /**
   * 检查配置是否存在
   */
  static hasConfig(key: string): boolean {
    return this.getConfig(key) !== null;
  }

  /**
   * 获取机器人 Token
   */
  static getBotToken(): string {
    return this.getConfig('bot_token') || '';
  }

  /**
   * 设置机器人 Token
   */
  static setBotToken(token: string): void {
    this.setConfig('bot_token', token, 'Telegram机器人Token');
  }

  /**
   * 获取默认价格阈值
   */
  static getPriceThreshold(): number {
    const value = this.getConfig('price_threshold');
    return value ? parseFloat(value) : 5;
  }

  /**
   * 设置默认价格阈值
   */
  static setPriceThreshold(threshold: number): void {
    this.setConfig('price_threshold', threshold.toString(), '默认价格变动阈值（百分比）');
  }

  /**
   * 获取管理员凭证
   */
  static getAdminCredentials(): { username: string; password: string } {
    // 从 admins 表获取
    const { AdminService } = require('./admin.service');
    const admin = AdminService.getAdminByUsername('admin');

    return {
      username: admin?.username || 'admin',
      password: admin?.password || '',
    };
  }

  /**
   * 获取检查间隔（秒）
   */
  static getCheckInterval(): number {
    const value = this.getConfig('check_interval');
    return value ? parseInt(value, 10) : 60;
  }

  /**
   * 设置检查间隔
   */
  static setCheckInterval(interval: number): void {
    this.setConfig('check_interval', interval.toString(), '价格检查间隔（秒）');
  }

  /**
   * 获取提醒冷却时间（秒）
   * @deprecated 使用 getAlertInterval 替代
   */
  static getAlertCooldown(): number {
    return this.getAlertInterval();
  }

  /**
   * 设置提醒冷却时间
   * @deprecated 使用 setAlertInterval 替代
   */
  static setAlertCooldown(cooldown: number): void {
    this.setAlertInterval(cooldown);
  }

  /**
   * 获取价格提醒间隔（秒）
   */
  static getAlertInterval(): number {
    const value = this.getConfig('alert_interval');
    return value ? parseInt(value, 10) : 1800; // 默认30分钟
  }

  /**
   * 设置价格提醒间隔
   */
  static setAlertInterval(interval: number): void {
    this.setConfig('alert_interval', interval.toString(), '价格提醒间隔（秒）');
  }

  /**
   * 获取 Binance API URL
   */
  static getBinanceApiUrl(): string {
    return this.getConfig('binance_api_url') || 'https://api.binance.com';
  }

  /**
   * 设置 Binance API URL
   */
  static setBinanceApiUrl(url: string): void {
    this.setConfig('binance_api_url', url, 'Binance API地址');
  }
}