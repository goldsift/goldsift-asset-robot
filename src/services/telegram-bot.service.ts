import TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@/lib/config.service';
import { GroupService } from './group.service';
import { WatchlistService } from './watchlist.service';
import { BinanceService } from './binance.service';
import type { AssetType } from '@/types/bot';

// 声明全局类型
declare global {
  var __telegramBotServiceInstance: TelegramBotService | undefined;
}

export class TelegramBotService {
  private static instance: TelegramBotService;
  private bot: TelegramBot | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): TelegramBotService {
    // 使用 globalThis 确保在 Next.js HMR 环境下也是真正的单例
    if (!globalThis.__telegramBotServiceInstance) {
      globalThis.__telegramBotServiceInstance = new TelegramBotService();
    }
    return globalThis.__telegramBotServiceInstance;
  }

  /**
   * 启动机器人
   */
  async start(): Promise<boolean> {
    if (this.isRunning && this.bot) {
      console.log('机器人已在运行中');
      return true;
    }

    // 如果之前有实例，先彻底停止
    if (this.bot) {
      console.log('检测到旧的机器人实例，正在停止...');
      await this.forceStop();
    }

    const botToken = ConfigService.getBotToken();
    if (!botToken) {
      console.error('未配置机器人 Token');
      return false;
    }

    try {
      console.log('正在启动新的机器人实例...');
      const tempBot = new TelegramBot(botToken, { polling: true });
      let pollingError = false;

      // 监听轮询错误
      tempBot.on('polling_error', (error) => {
        console.error('轮询错误:', error);
        pollingError = true;
        // 发生轮询错误时自动停止机器人
        this.isRunning = false;
        this.bot = null;
        try {
          tempBot.stopPolling();
          tempBot.removeAllListeners();
        } catch (e) {
          // 忽略停止错误
        }
      });

      // 等待短暂时间确认轮询能正常启动
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 如果轮询出错,抛出异常
      if (pollingError) {
        throw new Error('轮询启动失败: Token 无效或有其他实例在运行');
      }

      // 确认没问题后才赋值和设置状态
      this.bot = tempBot;
      this.setupCommands();
      this.isRunning = true;
      console.log('电报机器人启动成功');
      return true;
    } catch (error: any) {
      console.error('启动机器人失败:', error);

      // 确保清理状态
      await this.forceStop();

      return false;
    }
  }

  /**
   * 停止机器人
   */
  async stop(): Promise<void> {
    if (this.bot) {
      try {
        await this.bot.stopPolling();
        this.bot.removeAllListeners();
        this.bot = null;
        this.isRunning = false;
        console.log('电报机器人已停止');
      } catch (error) {
        console.error('停止机器人时出错:', error);
        // 强制清理
        await this.forceStop();
      }
    }
  }

  /**
   * 强制停止机器人（清理所有资源）
   */
  private async forceStop(): Promise<void> {
    try {
      if (this.bot) {
        // 移除所有监听器
        this.bot.removeAllListeners();

        // 尝试停止轮询
        try {
          await this.bot.stopPolling({ cancel: true, reason: 'Force stop' });
        } catch (e) {
          // 忽略停止轮询的错误
        }

        this.bot = null;
      }
      this.isRunning = false;
      console.log('机器人已强制停止');
    } catch (error) {
      console.error('强制停止机器人时出错:', error);
      // 无论如何都要重置状态
      this.bot = null;
      this.isRunning = false;
    }
  }

  /**
   * 获取运行状态
   */
  getStatus(): boolean {
    return this.isRunning;
  }

  /**
   * 设置命令处理器
   */
  private setupCommands(): void {
    if (!this.bot) return;

    // 记录所有接收到的消息
    this.bot.on('message', (msg) => {
      this.logMessage(msg);
    });

    // /register 命令 - 注册群组
    this.bot.onText(/\/register/, (msg) => this.handleRegisterCommand(msg));

    // /help 命令
    this.bot.onText(/\/help/, (msg) => this.handleHelpCommand(msg));

    // /watch 命令
    this.bot.onText(/\/watch/, (msg) => this.handleWatchCommand(msg));

    // /list 命令
    this.bot.onText(/\/list/, (msg) => this.handleListCommand(msg));

    // /unwatch 命令
    this.bot.onText(/\/unwatch/, (msg) => this.handleUnwatchCommand(msg));

    // 错误处理
    this.bot.on('polling_error', (error) => {
      console.error('轮询错误:', error);
    });
  }

  /**
   * 记录接收到的消息
   */
  private logMessage(msg: TelegramBot.Message): void {
    const timestamp = new Date().toISOString();
    const chatType = msg.chat.type;
    const chatId = msg.chat.id;
    const chatName = msg.chat.title || msg.chat.username || msg.chat.first_name || '未知';
    const userId = msg.from?.id;
    const username = msg.from?.username || msg.from?.first_name || '未知用户';
    const messageText = msg.text || '[非文本消息]';

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📨 收到消息 [${timestamp}]`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`聊天类型: ${chatType}`);
    console.log(`聊天ID: ${chatId}`);
    console.log(`聊天名称: ${chatName}`);
    console.log(`用户ID: ${userId}`);
    console.log(`用户名: ${username}`);
    console.log(`消息内容: ${messageText}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }

  /**
   * 记录操作日志
   */
  private logOperation(
    operation: string,
    chatId: string,
    userId: number | undefined,
    details: Record<string, any>,
    success: boolean
  ): void {
    const timestamp = new Date().toISOString();
    const status = success ? '✅ 成功' : '❌ 失败';

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 操作日志 [${timestamp}]`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`操作类型: ${operation}`);
    console.log(`状态: ${status}`);
    console.log(`聊天ID: ${chatId}`);
    console.log(`用户ID: ${userId || '未知'}`);
    console.log(`详细信息:`);
    Object.entries(details).forEach(([key, value]) => {
      console.log(`  - ${key}: ${JSON.stringify(value)}`);
    });
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }

  /**
   * 验证群组权限
   */
  private async checkGroupPermission(msg: TelegramBot.Message): Promise<boolean> {
    const chatId = msg.chat.id.toString();

    // 只允许群组使用
    if (msg.chat.type === 'private') {
      await this.bot?.sendMessage(chatId, '❌ 此机器人仅支持在群组中使用');
      return false;
    }

    // 检查白名单
    if (!GroupService.isGroupWhitelisted(chatId)) {
      await this.bot?.sendMessage(chatId, '❌ 此群组未在白名单中，无法使用机器人功能');
      return false;
    }

    return true;
  }

  /**
   * 处理 /watch 命令
   * 格式: /watch <自然语言描述>
   * 例如: /watch 大饼现货,关注价格11111
   */
  private async handleWatchCommand(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id.toString();
    const userId = msg.from?.id;

    // 验证权限
    if (!(await this.checkGroupPermission(msg))) {
      this.logOperation('添加监控', chatId, userId, { error: '权限验证失败' }, false);
      return;
    }

    // 解析用户输入
    const text = msg.text || '';
    let userInput = text.replace(/^\/watch\s*/, '').trim();
    // 剔除 bot 用户名
    userInput = userInput.replace(/@\w+/g, '').trim();

    if (!userInput) {
      await this.bot?.sendMessage(
        chatId,
        '❌ 请指定要监控的交易对\n\n' +
          '使用示例:\n' +
          '• /watch 大饼现货\n' +
          '• /watch 以太合约,关注价格2000\n' +
          '• /watch SOL 阈值3%\n' +
          '• /watch BTCUSDT'
      );
      this.logOperation('添加监控', chatId, userId, { error: '参数为空' }, false);
      return;
    }

    await this.bot?.sendMessage(chatId, '🔍 正在解析命令...');

    try {
      // 调用 OpenAI 解析命令
      const { OpenAIService } = await import('./openai.service');
      const parsed = await OpenAIService.parseWatchCommand(userInput);

      console.log('解析结果:', parsed);

      // 检查是否识别成功
      if (!parsed.recognized || !parsed.symbol) {
        await this.bot?.sendMessage(
          chatId,
          '❌ 无法识别交易对\n\n' +
            '请尝试:\n' +
            '• 使用标准格式: BTCUSDT, ETHUSDT\n' +
            '• 使用通俗名称: 大饼, 以太, SOL\n' +
            '• 明确说明交易类型: 现货/合约'
        );
        this.logOperation('添加监控', chatId, userId, {
          input: userInput,
          error: '无法识别交易对'
        }, false);
        return;
      }

      // 验证交易对
      const validation = await BinanceService.validateSymbol(parsed.symbol, parsed.type);

      if (!validation.valid) {
        const typeText = parsed.type ? `${parsed.type === 'spot' ? '现货' : '合约'}` : '';
        await this.bot?.sendMessage(
          chatId,
          `❌ 无法找到交易对: ${parsed.symbol}${typeText ? ` (${typeText})` : ''}\n\n` +
          '请检查:\n' +
          '1. 交易对格式是否正确 (如 BTCUSDT)\n' +
          '2. 该交易对在币安是否存在'
        );
        this.logOperation('添加监控', chatId, userId, {
          input: userInput,
          parsed,
          error: '交易对验证失败'
        }, false);
        return;
      }

      // 使用验证后的类型和价格
      const finalType = validation.type as 'spot' | 'futures';
      const currentPrice = validation.price!;

      // 使用用户指定的参考价格,或当前价格
      const referencePrice = parsed.referencePrice || currentPrice.toString();

      // 添加或更新关注列表
      const result = WatchlistService.addWatchlist(
        chatId,
        parsed.symbol,
        finalType,
        parseFloat(referencePrice),
        userId?.toString() || 'unknown',
        parsed.threshold
      );

      if (result.success) {
        const thresholdText = parsed.threshold || 5;
        const typeText = finalType === 'spot' ? '现货' : '合约';
        const actionText = result.isUpdate ? '已更新关注' : '已添加关注';
        const actionEmoji = result.isUpdate ? '🔄' : '✅';

        await this.bot?.sendMessage(
          chatId,
          `${actionEmoji} ${actionText}\n\n` +
            `标的: ${parsed.symbol}\n` +
            `类型: ${typeText}\n` +
            `参考价格: $${referencePrice}\n` +
            `当前价格: $${currentPrice}\n` +
            `价格阈值: ${thresholdText}%`
        );

        this.logOperation(result.isUpdate ? '更新监控' : '添加监控', chatId, userId, {
          input: userInput,
          symbol: parsed.symbol,
          asset_type: finalType,
          reference_price: referencePrice,
          current_price: currentPrice,
          threshold: thresholdText
        }, true);
      } else {
        await this.bot?.sendMessage(chatId, `❌ 操作失败，请稍后重试`);
        this.logOperation('添加监控', chatId, userId, {
          input: userInput,
          parsed,
          error: '数据库错误'
        }, false);
      }
    } catch (error: any) {
      console.error('处理 /watch 命令失败:', error);
      await this.bot?.sendMessage(
        chatId,
        `❌ 命令解析失败: ${error.message}\n\n` +
        '请重新输入或联系管理员'
      );
      this.logOperation('添加监控', chatId, userId, {
        input: userInput,
        error: error.message
      }, false);
    }
  }

  /**
   * 处理 /list 命令
   */
  private async handleListCommand(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id.toString();
    const userId = msg.from?.id;

    // 验证权限
    if (!(await this.checkGroupPermission(msg))) {
      this.logOperation('查看监控列表', chatId, userId, { error: '权限验证失败' }, false);
      return;
    }

    const watchlists = WatchlistService.getGroupWatchlists(chatId);

    if (watchlists.length === 0) {
      await this.bot?.sendMessage(chatId, '📋 当前没有关注任何标的\n\n使用 /watch 命令添加关注');
      this.logOperation('查看监控列表', chatId, userId, { count: 0 }, true);
      return;
    }

    let message = '📊 关注列表\n\n';

    for (let i = 0; i < watchlists.length; i++) {
      const item = watchlists[i];
      const currentPrice = await BinanceService.getAssetPrice(item.symbol, item.asset_type);

      if (currentPrice === null) {
        message += `${i + 1}. ${item.symbol} (${this.getAssetTypeName(item.asset_type)})\n`;
        message += `   ⚠️ 当前价格获取失败\n`;
        message += `   关注价格: $${item.reference_price.toFixed(8)}\n\n`;
        continue;
      }

      // 计算涨跌幅
      const changePercent = ((currentPrice - item.reference_price) / item.reference_price) * 100;
      const isUp = changePercent > 0;
      const changeIcon = isUp ? '📈' : (changePercent < 0 ? '📉' : '➡️');
      const changeText = isUp ? '+' : '';

      message += `${i + 1}. ${item.symbol} (${this.getAssetTypeName(item.asset_type)})\n`;
      message += `   关注价格: $${item.reference_price.toFixed(8)}\n`;
      message += `   当前价格: $${currentPrice.toFixed(8)}\n`;
      message += `   ${changeIcon} ${changeText}${changePercent.toFixed(2)}%\n\n`;
    }

    await this.bot?.sendMessage(chatId, message);
    this.logOperation('查看监控列表', chatId, userId, { count: watchlists.length }, true);
  }

  /**
   * 处理 /unwatch 命令
   * 格式: /unwatch <自然语言描述>
   * 例如: /unwatch 大饼现货
   */
  private async handleUnwatchCommand(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id.toString();
    const userId = msg.from?.id;

    // 验证权限
    if (!(await this.checkGroupPermission(msg))) {
      this.logOperation('移除监控', chatId, userId, { error: '权限验证失败' }, false);
      return;
    }

    // 解析用户输入
    const text = msg.text || '';
    let userInput = text.replace(/^\/unwatch\s*/, '').trim();
    // 剔除 bot 用户名
    userInput = userInput.replace(/@\w+/g, '').trim();

    if (!userInput) {
      await this.bot?.sendMessage(
        chatId,
        '❌ 请指定要取消监控的交易对\n\n' +
          '使用示例:\n' +
          '• /unwatch 大饼现货\n' +
          '• /unwatch 以太合约\n' +
          '• /unwatch BTCUSDT'
      );
      this.logOperation('移除监控', chatId, userId, { error: '参数为空' }, false);
      return;
    }

    await this.bot?.sendMessage(chatId, '🔍 正在解析命令...');

    try {
      // 调用 OpenAI 解析命令
      const { OpenAIService } = await import('./openai.service');
      const parsed = await OpenAIService.parseUnwatchCommand(userInput);

      console.log('解析结果:', parsed);

      // 检查是否识别成功
      if (!parsed.recognized || !parsed.symbol) {
        await this.bot?.sendMessage(
          chatId,
          '❌ 无法识别交易对\n\n' +
            '请尝试:\n' +
            '• 使用标准格式: BTCUSDT, ETHUSDT\n' +
            '• 使用通俗名称: 大饼, 以太, SOL\n' +
            '• 明确说明交易类型: 现货/合约'
        );
        this.logOperation('移除监控', chatId, userId, {
          input: userInput,
          error: '无法识别交易对'
        }, false);
        return;
      }

      // 如果指定了类型,直接尝试删除
      if (parsed.type) {
        const success = WatchlistService.removeWatchlist(chatId, parsed.symbol, parsed.type);

        if (success) {
          const typeText = parsed.type === 'spot' ? '现货' : '合约';
          await this.bot?.sendMessage(chatId, `✅ 已取消关注 ${parsed.symbol} (${typeText})`);
          this.logOperation('移除监控', chatId, userId, {
            input: userInput,
            symbol: parsed.symbol,
            asset_type: parsed.type
          }, true);
        } else {
          await this.bot?.sendMessage(chatId, `❌ 未找到该关注标的`);
          this.logOperation('移除监控', chatId, userId, {
            input: userInput,
            parsed,
            error: '未找到'
          }, false);
        }
        return;
      }

      // 未指定类型,先尝试现货再尝试合约
      let success = WatchlistService.removeWatchlist(chatId, parsed.symbol, 'spot');
      let finalType: 'spot' | 'futures' = 'spot';

      if (!success) {
        success = WatchlistService.removeWatchlist(chatId, parsed.symbol, 'futures');
        finalType = 'futures';
      }

      if (success) {
        const typeText = finalType === 'spot' ? '现货' : '合约';
        await this.bot?.sendMessage(chatId, `✅ 已取消关注 ${parsed.symbol} (${typeText})`);
        this.logOperation('移除监控', chatId, userId, {
          input: userInput,
          symbol: parsed.symbol,
          asset_type: finalType
        }, true);
      } else {
        await this.bot?.sendMessage(chatId, `❌ 未找到该关注标的`);
        this.logOperation('移除监控', chatId, userId, {
          input: userInput,
          parsed,
          error: '未找到'
        }, false);
      }
    } catch (error: any) {
      console.error('处理 /unwatch 命令失败:', error);
      await this.bot?.sendMessage(
        chatId,
        `❌ 命令解析失败: ${error.message}\n\n` +
        '请重新输入或联系管理员'
      );
      this.logOperation('移除监控', chatId, userId, {
        input: userInput,
        error: error.message
      }, false);
    }
  }

  /**
   * 处理 /register 命令
   * 将群组注册到白名单(待审核状态)
   */
  private async handleRegisterCommand(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id.toString();
    const userId = msg.from?.id;

    // 只允许群组注册
    if (msg.chat.type === 'private') {
      await this.bot?.sendMessage(chatId, '❌ 此命令仅支持在群组中使用');
      this.logOperation('注册群组', chatId, userId, { error: '私聊不支持注册' }, false);
      return;
    }

    // 检查是否已注册
    if (GroupService.isGroupWhitelisted(chatId)) {
      const group = GroupService.getGroupById(chatId);
      if (group?.is_active) {
        await this.bot?.sendMessage(chatId, '✅ 本群组已在白名单中并已启用');
        this.logOperation('注册群组', chatId, userId, { status: '已启用' }, true);
      } else {
        await this.bot?.sendMessage(chatId, '⏳ 本群组已注册，等待管理员在后台启用');
        this.logOperation('注册群组', chatId, userId, { status: '待审核' }, true);
      }
      return;
    }

    // 获取群组信息
    const groupName = msg.chat.title || '未知群组';

    // 添加到数据库(未激活状态)
    const success = GroupService.addGroup({
      group_id: chatId,
      group_name: groupName,
      description: '通过 /register 命令注册',
      is_active: 0, // 默认未激活
    });

    if (success) {
      await this.bot?.sendMessage(
        chatId,
        '✅ 群组注册成功！\n\n' +
        `📋 群组信息:\n` +
        `• 群组名称: ${groupName}\n` +
        `• 群组 ID: ${chatId}\n\n` +
        `⏳ 请联系管理员在后台启用本群组，启用后即可使用机器人功能。`
      );
      this.logOperation('注册群组', chatId, userId, {
        group_name: groupName,
        group_id: chatId,
        status: '待审核'
      }, true);
    } else {
      await this.bot?.sendMessage(chatId, '❌ 注册失败，请稍后重试或联系管理员');
      this.logOperation('注册群组', chatId, userId, { error: '数据库插入失败' }, false);
    }
  }

  /**
   * 处理 /help 命令
   * 显示帮助信息
   */
  private async handleHelpCommand(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id.toString();

    const helpMessage =
      '🤖 <b>智能标的监控机器人 - 使用帮助</b>\n\n' +
      '📌 <b>基础命令</b>\n' +
      '• /register - 注册群组到白名单(需管理员启用)\n' +
      '• /help - 查看此帮助信息\n\n' +
      '📊 <b>监控命令</b>(需群组已启用)\n' +
      '• /watch - 添加标的到监控列表\n' +
      '  使用自然语言描述,示例:\n' +
      '  <code>/watch 大饼现货</code>\n' +
      '  <code>/watch 以太合约,关注价格2000</code>\n' +
      '  <code>/watch SOL 阈值3%</code>\n' +
      '  <code>/watch BTCUSDT</code>\n\n' +
      '• /list - 查看当前监控列表\n\n' +
      '• /unwatch - 移除标的监控\n' +
      '  使用自然语言描述,示例:\n' +
      '  <code>/unwatch 大饼现货</code>\n' +
      '  <code>/unwatch 以太合约</code>\n' +
      '  <code>/unwatch BTCUSDT</code>\n\n' +
      '💡 <b>使用说明</b>\n' +
      '1. 群组管理员使用 /register 注册群组\n' +
      '2. 等待系统管理员在后台启用\n' +
      '3. 启用后可使用自然语言监控功能\n' +
      '4. 机器人会定期检查价格并自动提醒\n' +
      '5. 支持常见币种别名(大饼=BTC, 以太/姨太=ETH)\n\n' +
      '❓ 如有问题请联系管理员';

    await this.bot?.sendMessage(chatId, helpMessage, { parse_mode: 'HTML' });
  }

  /**
   * 发送消息到群组
   */
  async sendMessageToGroup(groupId: string, message: string): Promise<boolean> {
    if (!this.bot || !this.isRunning) {
      console.error('机器人未运行');
      return false;
    }

    try {
      await this.bot.sendMessage(groupId, message, { parse_mode: 'HTML' });
      return true;
    } catch (error) {
      console.error(`发送消息到群组 ${groupId} 失败:`, error);
      return false;
    }
  }

  /**
   * 获取资产类型中文名
   */
  private getAssetTypeName(type: AssetType): string {
    const names: Record<AssetType, string> = {
      spot: '现货',
      futures: '合约',
      alpha: 'Alpha',
    };
    return names[type] || type;
  }
}