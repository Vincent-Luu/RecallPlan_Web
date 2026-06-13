# RecallPlan Web — 艾宾浩斯复习日程管理系统

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-blue)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-orange)
![Neon Postgres](https://img.shields.io/badge/Neon-Serverless_Postgres-green)
![SQLite](https://img.shields.io/badge/SQLite-sql.js-lightgrey)

面向高中生的智能复习日程助手，基于**艾宾浩斯遗忘曲线**在最佳记忆节点自动生成复习计划，帮助学生用最少的重复次数实现最长久的记忆效果。

## 核心功能

### 艾宾浩斯智能排程
创建学习任务后，系统以创建日期为第 0 天，自动在第 **1、2、4、8、14、30** 天生成 6 次复习打卡。每次打开首页，当天待复习内容一目了然。

### 三卡片仪表盘
首页采用昨天 / 今天 / 明天三栏布局，今天的复习任务居中突出展示，左右两侧辅助参考。移动端自动切换极简模式，只保留今天卡片。

### 月度日历概览
顶部日历按钮打开月度视图弹窗——绿色表示当日全额完成，黄色表示还有待打卡项，点击任意日期可快速查看当天任务详情。

### 学科标签
每项任务可绑定学科标签（语文 / 数学 / 英语 / 物理 / 化学 / 生物 / 其他），各学科配有独立主题色，便于快速区分。

### 任务管理中心
`/tasks` 页面展示所有任务列表，包含每项任务的完成进度条，支持编辑标题/标签和删除任务。

### 备忘录
便签功能，可在首页侧栏记录文字备忘，支持编辑和删除。

### 高考倒计时
首页顶部可开启高考倒计时横幅，实时显示距离高考的天数。

### 20 分钟首次复习
艾宾浩斯方法的第一次复习安排在任务创建后的 20 分钟。首页每条当天新任务旁显示倒计时按钮，倒计时结束后方可打卡，确保在最佳记忆节点完成首次回顾。

### 多用户管理
- **用户注册与审批**：新用户可自行注册，admin 在设置页审批后生效
- **admin 视角切换**：admin 可查看任意用户的任务仪表盘
- **数据隔离**：普通用户只能看到自己的任务，admin 自有任务与其他用户数据隔离

### 深色/浅色主题
支持一键切换深色/浅色模式，设置自动持久化到本地。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router, SSR) |
| 样式 | Tailwind CSS 4 |
| ORM | Drizzle ORM |
| 数据库 | Neon Serverless Postgres / SQLite (sql.js) |
| 认证 | JWT (jose, HS256, httpOnly cookie) |
| 图标 | Lucide React |
| 时间 | date-fns |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

创建 `.env.local` 文件：

```env
# 数据库选择：postgresql（默认）或 sqlite
DATABASE_PROVIDER=sqlite

# PostgreSQL 模式（DATABASE_PROVIDER=postgresql 时必填）
DATABASE_URL=postgres://user:password@hostname/dbname?sslmode=require

# SQLite 模式（DATABASE_PROVIDER=sqlite 时可选，默认为 ./data/recallplan_web.db）
DATABASE_FILE=./data/recallplan_web.db

# 管理员账号
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password

# JWT 签名密钥
JWT_SECRET=your_random_secret
```

### 3. 初始化数据库

```bash
npx drizzle-kit push
```

### 4. 启动

```bash
npm run dev        # 开发模式 → http://localhost:3000
npm run build      # 生产构建
npm run start      # 生产启动
```

## 页面路由

| 路由 | 功能 |
|------|------|
| `/` | 三卡片仪表盘（昨天/今天/明天）+ 月度日历 + 新建任务 |
| `/login` | 登录 / 注册 |
| `/tasks` | 全部任务列表，支持编辑、删除，含进度条 |
| `/settings` | admin 用户管理（审批注册、创建/删除用户、切换视图） |
| `/settings/user/[id]/tasks` | admin 以目标用户身份查看仪表盘 |

## API 路由

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth` | 登录 |
| POST | `/api/auth/register` | 用户注册（需 admin 审批） |
| GET | `/api/tasks?date=YYYY-MM-DD` | 获取指定日期的复习任务 |
| POST | `/api/tasks` | 创建任务并生成艾宾浩斯周期 taskLog |
| PATCH | `/api/tasks/[id]` | 切换单条 taskLog 完成状态 |
| GET | `/api/tasks/all` | 获取当前用户全部任务及进度 |
| GET | `/api/tasks/month?start=&end=` | 获取日期范围内的完成统计 |
| DELETE | `/api/tasks/manage/[id]` | 删除任务及关联 taskLog |
| PATCH | `/api/tasks/manage/[id]` | 编辑任务标题和标签 |
| GET | `/api/memos` | 获取当前用户备忘录 |
| POST | `/api/memos` | 创建备忘录 |
| PATCH | `/api/memos/[id]` | 编辑备忘录 |
| DELETE | `/api/memos/[id]` | 删除备忘录 |
| PATCH | `/api/settings` | 更新用户设置（高考倒计时开关） |
| GET | `/api/users` | admin 获取用户列表 |
| POST | `/api/users` | admin 创建用户 |
| DELETE | `/api/users/[id]` | admin 删除用户及关联数据 |
