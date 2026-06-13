# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

RecallPlan Web — 面向高中生的艾宾浩斯遗忘曲线复习日程管理系统。用户创建学习任务后，系统自动在第 1、2、4、8、14、30 天生成复习打卡安排。首页采用三卡片布局（昨天/今天/明天），支持月度日历概览、任务管理和多用户管理。

## 常用命令

```bash
npm run dev          # 启动开发服务器 (localhost:3000)
npm run build        # 生产构建
npm run start        # 启动生产服务器
npm run lint         # ESLint 检查
npx drizzle-kit push # 将 schema 同步到数据库（无迁移文件方式）
```

需要 `.env.local` 文件，包含 `DATABASE_URL`（Neon Postgres）、`ADMIN_USERNAME`、`ADMIN_PASSWORD`、`JWT_SECRET`。

## 技术架构

- **Next.js 16** (App Router, `force-dynamic` SSR) + **Tailwind CSS 4** + **Drizzle ORM** + **Neon Serverless Postgres**
- 认证：JWT（`jose` 库，HS256），存储在 httpOnly cookie 中，7 天过期
- 图标：Lucide React；时间处理：date-fns
- Server Components 负责数据获取，Client Components（使用 `"use client"`）负责交互

## 请求流程

1. `middleware.ts` 拦截所有非静态资源请求 → 检查 `auth_token` cookie → 未认证则重定向到 `/login`
2. Server Component 页面调用 `getCurrentUser()` 读取 JWT payload → 使用 Drizzle 查询 Neon → 将数据作为 props 传递给 Client Component
3. Client Component 通过 `fetch()` 调用 `/api/*` 进行数据变更，使用乐观更新模式

## 数据库（`db/schema.ts`）

- **users** — `id`, `username`, `password`（sha512 PBKDF2 加盐哈希）, `role`, `createdAt`
- **tasks** — `id`, `userId`（FK → users；admin 自有任务为 NULL）, `title`, `tag`（学科标签）, `createdAt`
- **taskLogs** — `id`, `taskId`（FK → tasks）, `scheduleDate`（`YYYY-MM-DD` 格式的 date 字符串）, `status`（boolean：false=待完成，true=已完成）

创建任务时，以创建日期为基准，按 [0, 1, 3, 7, 13, 29] 天的偏移量生成 6 条 taskLog 记录。

## API 路由

| 方法 | 路径 | 用途 |
|------|------|------|
| POST | `/api/auth` | 登录；先比对环境变量中的 admin，再查数据库 |
| GET | `/api/tasks?date=YYYY-MM-DD` | 获取某天的所有 taskLog（含 task title/tag） |
| POST | `/api/tasks` | 创建任务并生成艾宾浩斯复习周期的 taskLog |
| PATCH | `/api/tasks/[id]` | 切换单条 taskLog 的完成状态 |
| GET | `/api/tasks/all` | 获取当前用户的所有任务（含完成进度统计） |
| GET | `/api/tasks/month?start=&end=` | 获取日期范围内的每日完成状态 |
| DELETE | `/api/tasks/manage/[id]` | 删除任务及其所有关联 taskLog（admin 或拥有者） |
| PATCH | `/api/tasks/manage/[id]` | 编辑任务标题和标签（admin 或拥有者） |
| GET/POST | `/api/users` | 用户列表 / 创建用户（admin 专用） |
| DELETE | `/api/users/[id]` | 级联删除用户及其所有任务和 taskLog（admin 专用） |

所有 API 路由均通过 `getCurrentUser()` 进行认证，多用户数据隔离条件为：admin 自有任务 `userId IS NULL`，普通用户 `userId = user.id`，admin 查看他人时 `userId = targetUserId`。

## 页面结构

| 路由 | 类型 | 功能 |
|------|------|------|
| `/` | SSR → Client | 三卡片仪表盘（昨天/今天/明天），月度日历弹窗，新建任务弹窗 |
| `/login` | Client | 登录表单 |
| `/tasks` | Client | 所有任务列表，支持编辑/删除，含进度条 |
| `/settings` | SSR → Client | admin 用户管理（创建/删除用户，查看用户任务） |
| `/settings/user/[id]/tasks` | SSR → Client | admin 以目标用户身份查看仪表盘 |

## 关键模式

- **乐观更新**：`DashboardClient` 在切换任务状态时立即更新本地 state，若 API 调用失败则重新获取数据回滚
- **Admin 用户模型**：admin 有两种形态——环境变量中配置的超级管理员（`id = null`，`admin = true`）和数据库中 `role = 'admin'` 的普通管理员。环境变量 admin 登录时不查数据库
- **学科标签**：在 `DashboardClient` 和 `tasks/page` 中均定义了相同的 `SUBJECT_TAGS` 数组（语文/数学/英语/物理/化学/生物/其他），各有独立的颜色主题 — 修改标签时需同时更新两处
- **主题切换**：`ThemeProvider`（`app/components/ThemeProvider.tsx`）使用 React Context + localStorage + `<html>` class 切换实现深色/浅色模式，通过 `suppressHydrationWarning` 和延迟挂载避免水合不匹配
- **数据库连接**：`db/index.ts` 使用 `@neondatabase/serverless` 的 HTTP 驱动 + `drizzle-orm/neon-http`，非连接池模式
