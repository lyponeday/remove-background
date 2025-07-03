# AI Background Remover

一个基于 Next.js 构建的AI背景移除应用，使用 Replicate API 提供高质量的背景移除服务。

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/lius-projects-1953349c/v0-next-js-project-requirements)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/hqR2K9EkSXw)

## 🚀 功能特色

- **AI 背景移除**: 使用先进的 AI 模型自动移除图片背景
- **用户认证系统**: 完整的注册、登录、邮箱验证流程
- **订阅付费模式**: 支持免费、高级、专业三种订阅计划
- **国际化支持**: 中英文双语界面
- **响应式设计**: 适配移动端和桌面端
- **深色/浅色主题**: 用户可自由切换主题

## 🛠️ 技术栈

- **前端**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes, Neon Database (PostgreSQL)
- **AI服务**: Replicate API (851-labs/background-remover)
- **支付**: Stripe
- **邮件**: Resend
- **部署**: Vercel

## 📦 安装和配置

### 1. 克隆项目

```bash
git clone <repository-url>
cd remove-background
```

### 2. 安装依赖

```bash
npm install --legacy-peer-deps
```

### 3. 环境变量配置

复制 `.env.example` 到 `.env.local` 并配置以下环境变量：

```env
# 数据库配置 (Neon Database)
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Replicate API 配置
REPLICATE_API_TOKEN="r8_your_token_here"

# 邮件服务配置 (Resend)
RESEND_API_KEY="re_your_resend_key_here"

# Stripe 支付配置
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PREMIUM_PRICE_ID="price_your_premium_price_id"
STRIPE_PRO_PRICE_ID="price_your_pro_price_id"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"

# 应用配置
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 4. 数据库设置

运行数据库脚本创建必要的表：

```sql
-- 在你的 Neon Database 中执行 scripts/001-create-tables.sql
```

### 5. 获取 Replicate API Token

1. 访问 [Replicate](https://replicate.com/)
2. 注册并获取 API Token
3. 设置环境变量：
   ```bash
   export REPLICATE_API_TOKEN=r8_your_token_here
   ```

### 6. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。

## 🎯 核心功能使用

### 背景移除

1. **注册账户**: 访问 `/signup` 创建账户
2. **验证邮箱**: 检查邮箱验证链接
3. **选择订阅**: 访问 `/pricing` 选择付费计划
4. **上传图片**: 访问 `/remove-bg` 上传图片
5. **下载结果**: 等待处理完成后下载无背景图片

### API 使用

```javascript
// 调用背景移除 API
const formData = new FormData()
formData.append('image', imageFile)

const response = await fetch('/api/remove-background', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': 'Bearer your-session-token'
  }
})

if (response.ok) {
  const blob = await response.blob()
  // 处理返回的图片 blob
}
```

## 🔧 开发工具

项目提供了开发工具页面 `/dev-tools`，包含：

- 系统状态检查
- 数据库连接测试
- 邮件发送测试
- 验证链接生成

## 📱 支持的图片格式

- PNG
- JPEG/JPG
- 最大文件大小：10MB

## 💳 订阅计划

- **免费版**: 每月 3 张图片
- **高级版**: 每月 100 张图片 ($9.99/月)
- **专业版**: 无限制图片 ($19.99/月)

## 🚀 部署

项目已配置为自动部署到 Vercel：

1. 推送代码到 GitHub
2. 连接 Vercel 到你的仓库
3. 配置环境变量
4. 自动部署完成

**在线地址**: [https://vercel.com/lius-projects-1953349c/v0-next-js-project-requirements](https://vercel.com/lius-projects-1953349c/v0-next-js-project-requirements)

## 🤝 继续开发

在 [v0.dev](https://v0.dev/chat/projects/hqR2K9EkSXw) 继续构建你的应用。

## 📄 许可证

此项目基于 MIT 许可证开源。

---

**注意**: 本项目由 [v0.dev](https://v0.dev) 生成，并与部署的应用保持同步。
