/**
 * Next.js Instrumentation Hook
 * 在服务器启动时自动初始化机器人服务
 */

export async function register() {
  // 只在Node.js运行时执行（服务器端）
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeBotServices } = await import('./lib/bot-lifecycle');
    await initializeBotServices();
  }
}