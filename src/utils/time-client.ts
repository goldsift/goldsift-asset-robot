/**
 * 客户端时间格式化工具
 * 专门用于客户端组件,不依赖服务端模块
 */

/**
 * 格式化 Unix 时间戳为本地时间字符串
 * @param timestamp Unix 时间戳（秒）
 * @param format 格式类型
 * @returns 格式化的时间字符串
 */
export function formatTimestamp(
  timestamp: number | null | undefined,
  format: 'datetime' | 'date' | 'time' = 'datetime'
): string {
  if (!timestamp) {
    return '-';
  }

  const date = new Date(timestamp * 1000);

  switch (format) {
    case 'datetime':
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    case 'date':
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    case 'time':
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
  }
}

/**
 * 获取相对时间描述（如：刚刚、5分钟前、2小时前）
 * @param timestamp Unix 时间戳（秒）
 * @returns 相对时间描述
 */
export function formatRelativeTime(timestamp: number | null | undefined): string {
  if (!timestamp) {
    return '未知';
  }

  const now = Math.floor(Date.now() / 1000);
  const seconds = now - timestamp;

  if (seconds < 10) {
    return '刚刚';
  }
  if (seconds < 60) {
    return `${seconds}秒前`;
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}分钟前`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours}小时前`;
  }
  if (seconds < 2592000) {
    // 30天
    const days = Math.floor(seconds / 86400);
    return `${days}天前`;
  }

  // 超过30天，显示具体日期
  return formatTimestamp(timestamp, 'datetime');
}