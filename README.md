# RecallPlan Web - 艾宾浩斯复习日程管理系统

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-blue)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-orange)
![Neon Postgres](https://img.shields.io/badge/Neon-Postgres-green)

这是一个专门为高中生设计的复习日程助手，核心功能基于**艾宾浩斯遗忘曲线**（Ebbinghaus Forgetting Curve），旨在帮助学生在最佳的时间节点进行复习，从而实现长久记忆。

## 🌟 核心功能

- **艾宾浩斯智能排程**: 只需添加一次任务，系统会自动生成复习周期（第 1, 2, 4, 8, 14, 30 天）。
- **三卡片沉浸式视图**: 
  - **中间**: 今天的 TODO（重点突出）。
  - **左右**: 昨天与明天的 TODO（辅助参考，移动端自动开启极简模式）。
- **交互式月度统计**: 精美的日历概览，绿色表示全额完成，黄色表示待打卡，点击日期可快速预览详情。
- **任务管理中心**: 提供任务的编辑与删除功能，一站式管理所有复习计划。
- **性能优化 (SSR)**: 引入服务端渲染与骨架屏技术，确保首屏加载极速且无闪烁。
- **用户认证**: 简单安全的单用户系统，通过环境变量灵活配置。

## 🛠️ 技术架构

- **前端**: Next.js 15 (App Router), Tailwind CSS
- **后端**: Next.js API Routes, Drizzle ORM
- **数据库**: Neon Serverless Postgres (SQL)
- **图标**: Lucide React
- **时间处理**: Date-fns

## 🚀 快速开始

### 1. 克隆并安装依赖
```bash
npm install
```

### 2. 环境配置
在根目录创建 `.env.local` 文件并配置以下变量：
```env
# 数据库连接地址 (Neon Postgres)
DATABASE_URL=postgres://user:password@hostname/dbname?sslmode=require

# 用户认证信息
ADMIN_USER=your_username
ADMIN_PASSWORD=your_password

# JWT 密钥
JWT_SECRET=your_random_secret
```

### 3. 初始化数据库
```bash
npx drizzle-kit push
```

### 4. 启动开发服务器
```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可开始使用！

## 🎨 界面展示
- **首页**: 核心三卡片布局设计。
- **日历**: 顶栏“月度视图”按钮触发，采用玻璃拟态设计（Glassmorphism）。
- **管理页**: 列表展示所有基础任务，支持快捷操作。

---

*Made with ❤️ for students who want to study smarter.*
