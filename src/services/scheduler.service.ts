/**
 * 定时任务调度服务
 */

type TaskCallback = () => void | Promise<void>;

interface ScheduledTask {
  id: string;
  callback: TaskCallback;
  interval: number;
  timer: NodeJS.Timeout;
}

// 声明全局类型
declare global {
  var __schedulerServiceTasks: Map<string, ScheduledTask> | undefined;
}

export class SchedulerService {
  private static get tasks(): Map<string, ScheduledTask> {
    if (!globalThis.__schedulerServiceTasks) {
      globalThis.__schedulerServiceTasks = new Map();
    }
    return globalThis.__schedulerServiceTasks;
  }

  /**
   * 添加定时任务
   * @param id 任务ID
   * @param callback 回调函数
   * @param interval 执行间隔（毫秒）
   */
  static addTask(id: string, callback: TaskCallback, interval: number): void {
    // 如果任务已存在，先停止它
    if (this.tasks.has(id)) {
      this.stopTask(id);
    }

    // 创建新的定时任务
    const timer = setInterval(async () => {
      try {
        await callback();
      } catch (error) {
        console.error(`定时任务 ${id} 执行失败:`, error);
      }
    }, interval);

    this.tasks.set(id, {
      id,
      callback,
      interval,
      timer,
    });

    console.log(`✓ 定时任务已启动: ${id}, 间隔: ${interval}ms`);
  }

  /**
   * 停止定时任务
   * @param id 任务ID
   */
  static stopTask(id: string): void {
    const task = this.tasks.get(id);
    if (task) {
      clearInterval(task.timer);
      this.tasks.delete(id);
      console.log(`✓ 定时任务已停止: ${id}`);
    }
  }

  /**
   * 停止所有定时任务
   */
  static stopAllTasks(): void {
    for (const [id, task] of this.tasks.entries()) {
      clearInterval(task.timer);
      console.log(`✓ 定时任务已停止: ${id}`);
    }
    this.tasks.clear();
  }

  /**
   * 获取所有任务ID
   */
  static getTaskIds(): string[] {
    return Array.from(this.tasks.keys());
  }

  /**
   * 检查任务是否存在
   */
  static hasTask(id: string): boolean {
    return this.tasks.has(id);
  }

  /**
   * 立即执行任务一次（不影响定时执行）
   */
  static async runTaskNow(id: string): Promise<void> {
    const task = this.tasks.get(id);
    if (task) {
      try {
        await task.callback();
      } catch (error) {
        console.error(`手动执行任务 ${id} 失败:`, error);
        throw error;
      }
    } else {
      throw new Error(`任务不存在: ${id}`);
    }
  }
}