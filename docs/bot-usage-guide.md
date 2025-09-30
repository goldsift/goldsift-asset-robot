# 电报机器人使用指南

## 快速开始

### 1. 准备工作

#### 创建 Telegram 机器人
1. 在 Telegram 中找到 [@BotFather](https://t.me/botfather)
2. 发送 `/newbot` 命令
3. 按提示设置机器人名称和用户名
4. 保存获得的 Bot Token

#### 获取群组 ID
1. 将机器人添加到目标群组
2. 在群组中发送任意消息
3. 访问 `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. 在返回的 JSON 中找到 `chat.id` 字段（负数）

### 2. 配置系统

#### 方式1: 直接操作数据库
```bash
sqlite3 database/asset-robot.db
```

```sql
-- 设置机器人 Token
UPDATE config SET value = 'YOUR_BOT_TOKEN' WHERE key = 'bot_token';

-- 添加群组到白名单
INSERT INTO groups (group_id, group_name)
VALUES ('-1001234567890', '测试群组');

-- 查看配置
SELECT * FROM config;
SELECT * FROM groups;
```

#### 方式2: 使用配置 API（推荐，阶段4后台完成后）
```bash
# 设置 Bot Token
curl -X POST http://localhost:3000/api/config/bot-token \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_BOT_TOKEN"}'
```

### 3. 启动机器人

#### 方式1: 使用测试脚本（开发环境）
```bash
npm run test:bot
```

#### 方式2: 与 Next.js 一起运行
在 `src/app/page.tsx` 或任何服务端组件中:
```typescript
import { TelegramBotService } from '@/services/telegram-bot.service';

// 在服务器启动时自动启动机器人
TelegramBotService.getInstance().start();
```

#### 方式3: 使用 API
```bash
# 启动机器人
curl -X POST http://localhost:3000/api/bot \
  -H "Content-Type: application/json" \
  -d '{"action":"start"}'

# 查询状态
curl http://localhost:3000/api/bot

# 停止机器人
curl -X POST http://localhost:3000/api/bot \
  -H "Content-Type: application/json" \
  -d '{"action":"stop"}'
```

## 机器人命令

### /watch - 添加关注标的

**格式:**
```
/watch <交易对> <类型> [阈值]
```

**参数说明:**
- `交易对`: 币安交易对符号，如 BTCUSDT、ETHUSDT
- `类型`: 资产类型
  - `spot`: 现货
  - `futures`: 合约
  - `alpha`: Alpha 标的
- `阈值`: 可选，价格变动百分比，默认 5%

**示例:**
```
/watch BTCUSDT spot
/watch BTCUSDT spot 3
/watch ETHUSDT futures 8
/watch DOGEUSDT alpha 10
```

**返回示例:**
```
✅ 已添加关注

标的: BTCUSDT
类型: 现货
参考价格: $45230.50000000
价格阈值: 5%
```

### /list - 查看关注列表

**格式:**
```
/list
```

**返回示例:**
```
📋 关注列表

━━━━━━━━━━━━
标的: BTCUSDT
类型: 现货
参考价格: $45230.50000000
当前价格: $45456.30000000
阈值: 5%
━━━━━━━━━━━━
标的: ETHUSDT
类型: 合约
参考价格: $2340.50000000
当前价格: $2358.80000000
阈值: 3%
```

### /unwatch - 取消关注

**格式:**
```
/unwatch <交易对> <类型>
```

**示例:**
```
/unwatch BTCUSDT spot
/unwatch ETHUSDT futures
```

**返回示例:**
```
✅ 已取消关注 BTCUSDT (现货)
```

## 常见问题

### Q: 机器人没有响应？
A: 检查以下几点:
1. 机器人是否已启动 (`npm run test:bot` 或查看 API 状态)
2. 机器人 Token 是否正确配置
3. 群组是否在白名单中
4. 机器人是否有群组管理员权限

### Q: 提示"此群组未在白名单中"？
A: 需要将群组 ID 添加到数据库的 groups 表中:
```sql
INSERT INTO groups (group_id, group_name)
VALUES ('你的群组ID', '群组名称');
```

### Q: 无法获取价格？
A: 可能的原因:
1. 交易对符号错误（必须是币安的有效交易对）
2. 网络连接问题
3. 币安 API 限流（已有10秒缓存减少请求）

### Q: 提示"此机器人仅支持在群组中使用"？
A: 这是设计如此，机器人不支持私聊使用，请在群组中使用。

### Q: 如何修改已关注标的的阈值？
A: 需要先取消关注，然后重新添加:
```
/unwatch BTCUSDT spot
/watch BTCUSDT spot 8
```

## 权限说明

### 群组权限
- 机器人必须被添加到群组
- 群组必须在白名单中
- 建议给予机器人发送消息权限

### 用户权限
- 当前版本所有群组成员都可以使用命令
- 未来版本将支持管理员专属命令

## 数据说明

### 价格缓存
- 价格数据缓存时间: 10秒
- 超过10秒会重新从币安获取
- 可减少 API 请求，避免限流

### 支持的交易对
- 所有币安现货交易对
- 所有币安合约交易对
- 交易对必须包含 USDT（如 BTCUSDT）

### 资产类型
- **spot**: 币安现货市场
- **futures**: 币安永续合约
- **alpha**: 早期/小币种（使用现货价格）

## 下一步

等待阶段3完成后，机器人将支持:
- 自动价格监控
- 价格变动提醒
- 智能提醒冷却

等待阶段4完成后，将提供:
- Web 后台管理界面
- 可视化配置管理
- 群组和关注列表管理

## 技术支持

遇到问题？
1. 检查 `npm run test:bot` 输出的测试结果
2. 查看 Node.js 控制台的错误日志
3. 检查数据库配置是否正确
4. 提交 Issue 到项目仓库