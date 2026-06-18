# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

RecallPlan Web — 面向高中生的艾宾浩斯遗忘曲线复习日程管理系统。用户创建学习任务后，系统自动在第 1、2、4、8、14、30 天生成复习打卡安排。首页采用三卡片布局（昨天/今天/明天），支持月度日历概览、任务管理、备忘录、高考倒计时和多用户管理。

## 常用命令

```bash
npm run dev          # 启动开发服务器 (localhost:3000)
npm run build        # 生产构建
npm run start        # 启动生产服务器
npm run lint         # ESLint 检查
npm run db:push      # 将 schema 同步到数据库
npm run db:generate  # 生成迁移文件
npm run db:migrate   # 执行迁移
npm run db:studio    # 启动 Drizzle Studio
```

需要 `.env.local` 文件，包含 `DATABASE_URL`（PostgreSQL 模式时必填）、`ADMIN_USERNAME`、`ADMIN_PASSWORD`、`JWT_SECRET`。可选 `DATABASE_PROVIDER`（默认 `postgresql`，设为 `sqlite` 启用本地 SQLite 模式）和 `DATABASE_FILE`（SQLite 数据库文件路径，默认 `./data/recallplan_web.db`）。

## 技术架构

- **Next.js 16** (App Router, `force-dynamic` SSR) + **Tailwind CSS 4** + **Drizzle ORM**
- **双数据库支持**：Neon Serverless Postgres（生产）和 SQLite via sql.js（本地开发/演示），通过 `DATABASE_PROVIDER` 环境变量切换
- 认证：JWT（`jose` 库，HS256），存储在 httpOnly cookie 中，7 天过期。无 middleware，各路由/页面自行调用 `getCurrentUser()` 进行认证
- 图标：Lucide React；时间处理：date-fns
- Server Components 负责数据获取，Client Components（使用 `"use client"`）负责交互

## 请求流程

1. 页面/API 路由调用 `getCurrentUser()` 读取 `auth_token` cookie → 校验 JWT → 返回 user payload（含 `admin`/`role`/`id`/`username`）
2. Server Component 页面使用 user payload → Drizzle 查询数据库 → 将数据作为 props 传递给 Client Component
3. Client Component 通过 `fetch()` 调用 `/api/*` 进行数据变更，使用乐观更新模式

## 数据库（`db/schema.ts` 为入口，实际定义在 `db/schema.pg.ts` / `db/schema.sqlite.ts`）

- **users** — `id`, `username`, `password`（sha512 PBKDF2 加盐哈希）, `status`（`'pending' | 'approved' | 'rejected'`，注册审批流程）, `role`（`'user' | 'admin'`）, `gaokaoEnabled`（boolean，高考倒计时开关）, `createdAt`
- **tasks** — `id`, `userId`（FK → users；admin 自有任务为 NULL）, `title`, `tag`（学科标签）, `createdAt`
- **taskLogs** — `id`, `taskId`（FK → tasks）, `scheduleDate`（`YYYY-MM-DD` 格式的 date 字符串）, `status`（boolean：false=待完成，true=已完成）, `type`（`'regular' | 'twenty_min'`，区分间隔复习与创建当天的 20 分钟首次复习）
- **memos** — `id`, `userId`（FK → users；admin 自有为 NULL）, `title`, `content`, `createdAt`, `updatedAt`

创建任务时，以创建日期为基准按 [1, 3, 7, 13, 29] 天偏移量生成 5 条 `regular` 类型的 taskLog（对应第 1、2、4、8、14、30 天中的后 5 次复习，不含创建当天）。若创建日期为今天，额外生成 1 条 `twenty_min` 类型的 taskLog 作为创建当天的 20 分钟首次复习。共计 6 次复习。

## API 路由

| 方法 | 路径 | 用途 |
|------|------|------|
| POST | `/api/auth` | 登录；先比对环境变量中的 admin，再查数据库 |
| POST | `/api/auth/register` | 用户自助注册，注册后状态为 `pending`，需 admin 审批 |
| GET | `/api/tasks?date=YYYY-MM-DD` | 获取某天的所有 taskLog（含 task title/tag/type） |
| POST | `/api/tasks` | 创建任务并生成艾宾浩斯复习周期的 taskLog |
| PATCH | `/api/tasks/[id]` | 切换单条 taskLog 的完成状态 |
| GET | `/api/tasks/all` | 获取当前用户的所有任务（含完成进度统计） |
| GET | `/api/tasks/month?start=&end=` | 获取日期范围内的每日完成状态 |
| DELETE | `/api/tasks/manage/[id]` | 删除任务及其所有关联 taskLog（admin 或拥有者） |
| PATCH | `/api/tasks/manage/[id]` | 编辑任务标题和标签（admin 或拥有者） |
| GET | `/api/memos` | 获取当前用户的备忘录列表（按更新时间倒序） |
| POST | `/api/memos` | 创建备忘录 |
| PATCH | `/api/memos/[id]` | 编辑备忘录标题/内容（拥有者或 admin） |
| DELETE | `/api/memos/[id]` | 删除备忘录（拥有者或 admin） |
| PATCH | `/api/settings` | 更新用户设置（高考倒计时开关 `gaokaoEnabled`） |
| GET | `/api/users` | 获取用户列表（admin 专用） |
| POST | `/api/users` | admin 创建用户（直接设为 `approved`） |
| PATCH | `/api/users/[id]` | admin 审批用户（将 status 设为 `approved` 或 `rejected`） |
| DELETE | `/api/users/[id]` | 级联删除用户及其所有任务、taskLog 和 memo（admin 专用） |

所有 API 路由均通过 `getCurrentUser()` 进行认证，多用户数据隔离条件为：admin 自有数据 `userId IS NULL`，普通用户 `userId = user.id`，admin 查看他人时 `userId = targetUserId`。

## 页面结构

| 路由 | 类型 | 功能 |
|------|------|------|
| `/` | SSR → Client | 三卡片仪表盘（昨天/今天/明天），高考倒计时横幅，月度日历弹窗，新建任务弹窗，备忘录侧栏，番茄钟按钮 |
| `/login` | Client | 登录表单 + 注册弹窗 |
| `/tasks` | Client | 所有任务列表，支持编辑/删除，含进度条 |
| `/settings` | SSR → Client | admin 用户管理（审批注册用户、创建/删除用户、查看用户任务） |
| `/settings/user/[id]/tasks` | SSR → Client | admin 以目标用户身份查看仪表盘 |

## 设计规范

每次添加或修改功能时，在动手实现之前先做一轮自我审查：

- **抽离重复** — 如果同一段逻辑在 3+ 个地方出现，先抽到共享模块再继续（例如 `userCondition` 模式曾经散落在 6 个 API 路由中，现已统一到 `db/repository.ts`）。
- **硬性隔离** — 不同实现路径（如 PostgreSQL vs SQLite）的差异应对 API 路由透明。路由不应知道底层用的是哪个驱动。隔离层（repository / adapter）集中管理差异，路由只调用统一接口。
- **先复用再新建** — 检查项目中是否已有可复用的组件、工具函数或样式模式。新增的 UI 卡片、页面容器、加载状态应复用现有风格，而不是另起一套。
- **类型安全不放水** — 关闭 `any` 必须有充分理由（repository 的类型隔离层是少数合理例外）。对外暴露的函数接口应有明确类型签名。
- **保留灵活性** — 以上规范是指导原则，不是教条。如果最佳实践在当前场景下引入了不必要的复杂度，用常识判断，在规范与务实之间取平衡。目标是"较为严谨的个人开发者"，不是企业级流程。

## 关键模式

- **乐观更新**：`DashboardClient` 在切换任务状态时立即更新本地 state，若 API 调用失败则重新获取数据回滚
- **Admin 用户模型**：admin 有两种形态——环境变量中配置的超级管理员（`id = null`，`admin = true`，不存数据库）和数据库中 `role = 'admin'` 的普通管理员。环境变量 admin 登录时不查数据库。env admin 没有 DB 记录，涉及用户自身设置（如 gaokao 偏好）时走 localStorage
- **学科标签**：在 `DashboardClient` 和 `tasks/page` 中均定义了相同的 `SUBJECT_TAGS` 数组（语文/数学/英语/物理/化学/生物/其他），各有独立的颜色主题 — 修改标签时需同时更新两处
- **主题切换**：`ThemeProvider`（`app/components/ThemeProvider.tsx`）使用 React Context + localStorage + `<html>` class 切换实现深色/浅色模式，通过 `suppressHydrationWarning` 和延迟挂载避免水合不匹配
- **双数据库支持**：`db/schema.ts` 根据 `DATABASE_PROVIDER` 动态加载 `schema.pg.ts` 或 `schema.sqlite.ts`，`db/client.ts` 同理切换 Neon HTTP 驱动和 sql.js WASM 驱动
- **SQLite 持久化**：`db/client.ts` 通过劫持 `sqlDb.run`/`exec`/`prepare` 方法自动检测写操作并延迟 100ms 持久化到磁盘文件，另有 5 秒间隔安全网定时写入；通过 `globalThis.__dbSingleton` 避免 Next.js 热重载时重复创建实例
- **注册审批流程**：用户通过 `/api/auth/register` 注册后 `status = 'pending'`，需 admin 在设置页通过 `/api/users/[id]` PATCH 审批为 `approved` 后才能正常使用。登录时检查 `status`，`pending` 用户被拒绝登录
- **20 分钟首次复习**：`TwentyMinButton` 组件对应 `type = 'twenty_min'` 的 taskLog——艾宾浩斯方法的第一次复习（学习后 20 分钟）。组件显示 20 分钟倒计时，倒计时结束前不可打卡，确保学生在最佳时间点完成首次回顾。仅创建当天的任务才会生成此条记录
- **中国时区**：`lib/chinaDate.ts` 提供 `chinaNow()`（每次调用时通过 `getTimezoneOffset()` 自动检测并补偿到 UTC+8，兼容 Vercel/UTC 服务器和本地开发机）和 `todayStr()`（`Intl.DateTimeFormat` + 显式 `timeZone: 'Asia/Shanghai'`，不依赖系统时区，作为"今天是几号"的权威基准）
