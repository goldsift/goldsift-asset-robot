import { formatInTimeZone } from 'date-fns-tz';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ConfigService } from './config.service';

/**
 * 时间工具服务类
 * 统一处理 Unix 时间戳和时区转换
 */
export class TimeService {
  /**
   * 获取当前 Unix 时间戳（秒）
   */
  static now(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * 获取当前 Unix 时间戳（毫秒）
   */
  static nowMs(): number {
    return Date.now();
  }

  /**
   * 将 Unix 时间戳转换为格式化的本地时间字符串
   * @param timestamp Unix 时间戳（秒）
   * @param formatStr 格式字符串，默认 'yyyy-MM-dd HH:mm:ss'
   * @returns 格式化的时间字符串
   */
  static format(
    timestamp: number | null | undefined,
    formatStr: string = 'yyyy-MM-dd HH:mm:ss'
  ): string {
    if (!timestamp) {
      return '-';
    }

    const timezone = ConfigService.getTimezone();
    const date = new Date(timestamp * 1000);

    return formatInTimeZone(date, timezone, formatStr, { locale: zhCN });
  }

  /**
   * 计算两个时间戳之间的差值（秒）
   * @param timestamp1 时间戳1（秒）
   * @param timestamp2 时间戳2（秒），默认为当前时间
   * @returns 差值（秒）
   */
  static diff(timestamp1: number, timestamp2: number = TimeService.now()): number {
    return Math.abs(timestamp2 - timestamp1);
  }

  /**
   * 检查时间戳是否在指定秒数之前
   * @param timestamp 时间戳（秒）
   * @param seconds 秒数
   * @returns 是否在指定秒数之前
   */
  static isBeforeSeconds(timestamp: number | null | undefined, seconds: number): boolean {
    if (!timestamp) {
      return true;
    }
    return this.now() - timestamp >= seconds;
  }

  /**
   * 格式化时间差为人类可读的字符串
   * @param seconds 秒数
   * @returns 格式化的时间差字符串
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}秒`;
    }
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}分钟`;
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
    }
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return hours > 0 ? `${days}天${hours}小时` : `${days}天`;
  }

  /**
   * 将 ISO 日期字符串或日期对象转换为 Unix 时间戳（秒）
   * @param date 日期字符串或日期对象
   * @returns Unix 时间戳（秒）
   */
  static toTimestamp(date: string | Date): number {
    const timestamp = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
    return Math.floor(timestamp / 1000);
  }

  /**
   * 获取相对时间描述（如：刚刚、5分钟前、2小时前）
   * @param timestamp Unix 时间戳（秒）
   * @returns 相对时间描述
   */
  static relative(timestamp: number | null | undefined): string {
    if (!timestamp) {
      return '未知';
    }

    const date = new Date(timestamp * 1000);
    const seconds = this.now() - timestamp;

    // 超过30天，显示具体日期
    if (seconds >= 2592000) {
      return this.format(timestamp);
    }

    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: zhCN
    });
  }
}