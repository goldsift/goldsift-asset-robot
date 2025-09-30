# 后台管理系统使用说明

## 阶段4开发完成

已成功开发完成的后台管理系统包括以下功能:

### 1. 登录系统 ✅
- **路径**: `/login`
- **默认账号**: `admin`
- **默认密码**: `admin123`
- **功能**:
  - 基于 JWT 的会话管理
  - Cookie 存储认证令牌
  - 密码使用 bcrypt 哈希存储
  - 中间件保护后台路由

### 2. 控制台页面 ✅
- **路径**: `/admin`
- **功能**:
  - 显示机器人运行状态
  - 显示统计数据(白名单群组数、关注标的数)
  - 提供重启机器人功能
  - 快捷导航到其他管理页面

### 3. 基础配置管理 ✅
- **路径**: `/admin/config`
- **功能**:
  - 管理 Bot Token(修改后自动重启机器人)
  - 管理默认价格阈值
  - 管理管理员用户名
  - 所有配置实时生效

### 4. 群组白名单管理 ✅
- **路径**: `/admin/groups`
- **功能**:
  - 查看所有白名单群组列表
  - 添加新群组(需要群组 ID 和名称)
  - 删除群组
  - 显示每个群组的关注标的数量

### 5. 关注列表管理 ✅
- **路径**: `/admin/watchlist`
- **功能**:
  - 查看所有关注标的
  - 按群组筛选
  - 按类型筛选(现货/合约/Alpha)
  - 实时显示当前价格和变动百分比
  - 删除关注标的

## 设计特点

### 视觉设计
- 采用币安风格配色方案
  - 主色: 白色背景
  - 强调色: 币安黄 (#F0B90B, #FCD535)
  - 状态色: 绿色(上涨)、红色(下跌)
- 统一的圆角和阴影效果
- 响应式布局

### 技术实现
- **前端**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **认证**: JWT + bcrypt + HTTP-only Cookie
- **数据库**: SQLite (已包含配置和管理)
- **API**: Next.js App Router API Routes

## 使用流程

### 1. 启动应用
```bash
# 开发环境
npm run dev

# 生产环境
npm run build
npm start
```

### 2. 登录后台
1. 访问 `http://localhost:3000/login`
2. 使用默认账号密码登录
3. 建议首次登录后修改密码

### 3. 配置机器人
1. 进入"基础配置"页面
2. 设置 Bot Token(从 @BotFather 获取)
3. 设置价格阈值(默认 5%)

### 4. 添加群组
1. 进入"群组管理"页面
2. 点击"添加群组"
3. 输入群组 ID 和名称
4. 确认添加

### 5. 管理关注列表
1. 进入"关注列表"页面
2. 查看所有群组的关注标的
3. 可按群组和类型筛选
4. 实时查看价格变动

## API 端点

### 认证相关
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出
- `GET /api/auth/me` - 获取当前用户信息

### 配置管理
- `GET /api/config` - 获取所有配置
- `PUT /api/config/bot-token` - 更新 Bot Token
- `PUT /api/config/threshold` - 更新价格阈值

### 群组管理
- `GET /api/groups` - 获取所有群组
- `POST /api/groups` - 添加群组
- `DELETE /api/groups?chat_id={id}` - 删除群组

### 关注列表
- `GET /api/watchlist` - 获取所有关注列表
- `DELETE /api/watchlist?id={id}` - 删除关注标的

### 机器人状态
- `GET /api/bot/status` - 获取机器人状态
- `POST /api/bot` - 重启机器人

## 安全特性

1. **密码加密**: 使用 bcrypt 哈希存储
2. **JWT 认证**: 令牌有效期 7 天
3. **HTTP-only Cookie**: 防止 XSS 攻击
4. **路由保护**: 中间件验证所有后台路由
5. **CSRF 保护**: 使用 Same-Site Cookie

## 下一步

阶段4开发完成!现在可以:

1. 测试后台管理系统的所有功能
2. 继续开发阶段5:完善与优化
   - 错误处理与日志
   - 性能优化
   - Docker 部署准备

## 屏幕截图位置

原型文件位于 `prototypes/` 目录:
- `01-login.html` - 登录页面原型
- `02-dashboard.html` - 控制台原型
- `03-config.html` - 配置管理原型
- `04-groups.html` - 群组管理原型
- `05-watchlist.html` - 关注列表原型