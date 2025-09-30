import { ConfigService } from '@/lib/config.service';

export interface ParsedWatchCommand {
  recognized: boolean;  // 是否识别成功
  symbol?: string;  // 交易对,如 BTCUSDT
  type?: 'spot' | 'futures';  // 类型,可选
  referencePrice?: string;  // 参考价格,可选
  threshold?: number;  // 阈值,可选
}

export interface ParsedUnwatchCommand {
  recognized: boolean;  // 是否识别成功
  symbol?: string;  // 交易对
  type?: 'spot' | 'futures';  // 类型,可选
}

export class OpenAIService {
  /**
   * 处理 API URL (Cherry Studio 风格)
   * - 以 / 结尾: 忽略 /v1,使用根路径
   * - 以 # 结尾: 强制使用输入的地址
   * - 其他: 默认添加 /v1
   */
  private static normalizeApiUrl(url: string): string {
    if (url.endsWith('/')) {
      // 以 / 结尾: 去掉 /v1
      return url.replace(/\/$/, '');
    } else if (url.endsWith('#')) {
      // 以 # 结尾: 强制使用输入地址
      return url.replace(/#$/, '');
    } else if (!url.includes('/v1')) {
      // 默认添加 /v1
      return `${url}/v1`;
    }
    return url;
  }

  /**
   * 调用 OpenAI API 解析 /watch 命令
   */
  static async parseWatchCommand(userInput: string): Promise<ParsedWatchCommand> {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 收到 /watch 命令参数');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`userInput: "${userInput}"`);
    console.log(`userInput 长度: ${userInput.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const apiUrl = ConfigService.getConfig('openai_api_url') || 'https://api.openai.com/v1';
    const apiKey = ConfigService.getConfig('openai_api_key');
    const model = ConfigService.getConfig('openai_model') || 'gpt-4o-mini';

    if (!apiKey) {
      throw new Error('未配置 OpenAI API Key');
    }

    const normalizedUrl = this.normalizeApiUrl(apiUrl);
    const endpoint = `${normalizedUrl}/chat/completions`;

    const instructionPrompt = `你是一个加密货币交易助手。用户会用自然语言描述想要监控的交易对,你需要将其解析为结构化数据。

规则:
1. 交易对格式为币安标准格式,如 BTCUSDT, ETHUSDT
2. 识别常用常见别名转换为标准格式，比如:
   - 比特币/BTC/大饼 → BTCUSDT
   - 以太坊/ETH/姨太/二饼 → ETHUSDT
   - 狗狗币/DOGE → DOGEUSDT
   - 索拉纳/SOL → SOLUSDT
3. 类型只有两种: spot(现货) 或 futures(合约)
4. 如果用户没有明确指定类型,type返回null
5. 如果用户指定了参考价格,提取数字
6. 如果用户指定了阈值百分比,提取数字
7. 如果无法识别交易对,recognized返回false

请严格按照以下JSON格式返回，不要包含任何其他文字、解释或markdown格式:
{
  "recognized": true,
  "symbol": "BTCUSDT",
  "type": "spot" | "futures" | null,
  "referencePrice": "43250.50" | null,
  "threshold": 5 | null
}

示例:
- 输入: "大饼现货,关注价格11111"
  输出: {"recognized":true,"symbol":"BTCUSDT","type":"spot","referencePrice":"11111","threshold":null}

- 输入: "以太合约"
  输出: {"recognized":true,"symbol":"ETHUSDT","type":"futures","referencePrice":null,"threshold":null}

- 输入: "SOL 阈值3%"
  输出: {"recognized":true,"symbol":"SOLUSDT","type":null,"referencePrice":null,"threshold":3}

- 输入: "今天天气怎么样"
  输出: {"recognized":false}

只返回 JSON,不要有其他文字。

用户输入: ${userInput}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'user', content: instructionPrompt }
          ],
          temperature: 0.1,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ OpenAI API 错误');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error(`状态码: ${response.status}`);
        console.error(`错误信息: ${errorText}`);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        throw new Error(`OpenAI API 错误: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🤖 OpenAI 解析结果 [/watch 命令]');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`用户输入: ${userInput}`);
      console.log(`模型: ${model}`);
      console.log(`原始返回:\n${content}`);

      if (!content) {
        console.error('❌ OpenAI 返回空内容');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        throw new Error('OpenAI 返回空内容');
      }

      // 清理可能的 Markdown 代码块标记
      let jsonContent = content;
      if (content.includes('```')) {
        // 移除 ```json 或 ``` 标记
        jsonContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      }

      // 解析 JSON
      const parsed = JSON.parse(jsonContent.trim());

      console.log('解析后的数据:');
      console.log(`  - recognized: ${parsed.recognized}`);
      console.log(`  - symbol: ${parsed.symbol || '未识别'}`);
      console.log(`  - type: ${parsed.type || '未指定'}`);
      console.log(`  - referencePrice: ${parsed.referencePrice || '未指定'}`);
      console.log(`  - threshold: ${parsed.threshold || '未指定'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      return {
        recognized: parsed.recognized === true,
        symbol: parsed.symbol || undefined,
        type: parsed.type || undefined,
        referencePrice: parsed.referencePrice || undefined,
        threshold: parsed.threshold || undefined,
      };
    } catch (error: any) {
      console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ OpenAI 解析失败 [/watch 命令]');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error(`错误类型: ${error.name}`);
      console.error(`错误信息: ${error.message}`);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      throw new Error(`命令解析失败: ${error.message}`);
    }
  }

  /**
   * 调用 OpenAI API 解析 /unwatch 命令
   */
  static async parseUnwatchCommand(userInput: string): Promise<ParsedUnwatchCommand> {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 收到 /unwatch 命令参数');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`userInput: "${userInput}"`);
    console.log(`userInput 长度: ${userInput.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const apiUrl = ConfigService.getConfig('openai_api_url') || 'https://api.openai.com/v1';
    const apiKey = ConfigService.getConfig('openai_api_key');
    const model = ConfigService.getConfig('openai_model') || 'gpt-4o-mini';

    if (!apiKey) {
      throw new Error('未配置 OpenAI API Key');
    }

    const normalizedUrl = this.normalizeApiUrl(apiUrl);
    const endpoint = `${normalizedUrl}/chat/completions`;

    const instructionPrompt = `你是一个加密货币交易助手。用户会用自然语言描述想要取消监控的交易对,你需要将其解析为结构化数据。

规则:
1. 交易对格式为币安标准格式,如 BTCUSDT, ETHUSDT
2. 识别常用常见别名转换为标准格式，比如:
   - 比特币/BTC/大饼 → BTCUSDT
   - 以太坊/ETH/姨太/二饼 → ETHUSDT
   - 狗狗币/DOGE → DOGEUSDT
   - 索拉纳/SOL → SOLUSDT
3. 类型只有两种: spot(现货) 或 futures(合约)
4. 如果用户没有明确指定类型,type返回null
5. 如果无法识别交易对,recognized返回false

请严格按照以下JSON格式返回，不要包含任何其他文字、解释或markdown格式:
{
  "recognized": true,
  "symbol": "BTCUSDT",
  "type": "spot" | "futures" | null
}

示例:
- 输入: "大饼现货"
  输出: {"recognized":true,"symbol":"BTCUSDT","type":"spot"}

- 输入: "ETH"
  输出: {"recognized":true,"symbol":"ETHUSDT","type":null}

- 输入: "今天天气"
  输出: {"recognized":false}

只返回 JSON,不要有其他文字。

用户输入: ${userInput}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'user', content: instructionPrompt }
          ],
          temperature: 0.1,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ OpenAI API 错误');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error(`状态码: ${response.status}`);
        console.error(`错误信息: ${errorText}`);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        throw new Error(`OpenAI API 错误: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🤖 OpenAI 解析结果 [/unwatch 命令]');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`用户输入: ${userInput}`);
      console.log(`模型: ${model}`);
      console.log(`原始返回:\n${content}`);

      if (!content) {
        console.error('❌ OpenAI 返回空内容');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        throw new Error('OpenAI 返回空内容');
      }

      // 清理可能的 Markdown 代码块标记
      let jsonContent = content;
      if (content.includes('```')) {
        // 移除 ```json 或 ``` 标记
        jsonContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      }

      // 解析 JSON
      const parsed = JSON.parse(jsonContent.trim());

      console.log('解析后的数据:');
      console.log(`  - recognized: ${parsed.recognized}`);
      console.log(`  - symbol: ${parsed.symbol || '未识别'}`);
      console.log(`  - type: ${parsed.type || '未指定'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      return {
        recognized: parsed.recognized === true,
        symbol: parsed.symbol || undefined,
        type: parsed.type || undefined,
      };
    } catch (error: any) {
      console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ OpenAI 解析失败 [/unwatch 命令]');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error(`错误类型: ${error.name}`);
      console.error(`错误信息: ${error.message}`);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      throw new Error(`命令解析失败: ${error.message}`);
    }
  }
}