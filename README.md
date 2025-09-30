# 智能标的电报机器人

一个基于 Next.js 的加密货币标的关注和价格提醒系统，通过 Telegram 机器人提供实时价格监控服务。

## 项目简介

该项目为电报群组提供加密货币标的价格监控和提醒功能，支持现货、合约和 Alpha 标的类型。系统包含电报机器人服务和 Web 后台管理系统。

### 主要功能

- **电报机器人服务**
  - `/watch` - 添加关注标的
  - `/list` - 查看关注列表
  - `/unwatch` - 取消关注
  - 群组白名单验证
  - 自动价格提醒（可自定义阈值，默认 5%）

- **后台管理系统**（中文界面）
  - 基础配置管理（机器人 Token、价格阈值等）
  - 群组白名单管理
  - 关注列表管理
  - 系统监控

## 技术栈

- **前端框架**: Next.js 15 + React 19 + TypeScript 5
- **样式**: Tailwind CSS 4
- **数据库**: SQLite
- **机器人**: node-telegram-bot-api
- **数据源**: Binance REST API
- **部署**: Docker

## 快速开始

### 环境要求

- Node.js 18.17 或更高版本
- npm 或 yarn

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd asset-robot

# 安装依赖
npm install

# 初始化数据库
npm run init:db

# 重置数据库（如需要）
npm run reset:db

# 测试机器人功能
npm run test:bot
```

### 开发

```bash
# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建

```bash
# 生产构建
npm run build

# 启动生产服务器
npm start
```

### 代码检查

```bash
# 运行 ESLint
npm run lint
```

## 项目结构

```
asset-robot/
├── src/
│   ├── app/              # Next.js App Router 页面
│   ├── components/       # React 组件
│   ├── lib/             # 工具库和数据库连接
│   └── types/           # TypeScript 类型定义
├── public/              # 静态资源
├── docs/                # 项目文档
│   ├── init.md         # 需求文档
│   ├── development-plan.md  # 开发计划
│   └── CLAUDE.md       # Claude Code 指导
└── README.md           # 项目说明
```

## 配置说明

系统配置存储在 SQLite 数据库中，通过后台管理界面进行管理：

- **机器人 Token**: Telegram Bot Token
- **价格阈值**: 默认 5%，可自定义
- **管理员账号**: 后台登录凭证
- **群组白名单**: 允许使用机器人的群组列表

### 默认登录凭证

首次安装后，可使用以下默认凭证登录后台管理系统：

- **用户名**: `admin`
- **密码**: `admin123`

⚠️ **重要**: 首次登录后请立即修改默认密码以确保系统安全。

## Docker 部署

```bash
# 构建镜像
docker build -t asset-robot .

# 运行容器
docker-compose up -d
```

详细部署说明请参考 `docs/deployment.md`（待添加）

## 开发状态

当前进度：**阶段 2 - 电报机器人核心功能（已完成）**

### 已完成功能
- [x] 初始化 Next.js 项目
- [x] 配置基础目录结构
- [x] 安装必要依赖
- [x] 数据库设计与初始化
- [x] 配置管理系统
- [x] 电报机器人核心功能
  - [x] 集成 node-telegram-bot-api
  - [x] 创建机器人基础架构和命令路由系统
  - [x] 实现群组白名单验证机制
  - [x] 实现 /watch 命令（添加关注标的）
  - [x] 实现 /list 命令（查询关注列表）
  - [x] 实现 /unwatch 命令（取消关注）
- [x] 价格数据集成
  - [x] 集成 Binance REST API
  - [x] 实现价格缓存机制（10秒缓存）
  - [x] 支持现货、合约、Alpha 标的类型

### 下一步任务
- [ ] 价格监控与提醒系统
- [ ] 后台管理系统
- [ ] 完善与优化

详细开发计划请查看 `docs/development-plan.md`

## 贡献指南

欢迎提交 Issue 和 Pull Request。

## 许可证

ISC