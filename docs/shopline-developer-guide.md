# Shopline 开发者入门教程

> 面向有 Node.js / React 经验的开发者，快速了解 Shopline 开放平台全貌并上手开发。

---

## 目录

1. [平台概览](#1-平台概览)
2. [注册与环境搭建](#2-注册与环境搭建)
3. [应用类型](#3-应用类型)
4. [开发工具](#4-开发工具)
5. [OAuth 2.0 授权流程](#5-oauth-20-授权流程)
6. [核心 API 能力](#6-核心-api-能力)
7. [Webhook 事件订阅](#7-webhook-事件订阅)
8. [应用扩展能力](#8-应用扩展能力)
9. [Demo：商品库存预警应用（Next.js）](#9-demo商品库存预警应用nextjs)
10. [上架与审核](#10-上架与审核)

---

## 1. 平台概览

**Shopline** 是一个面向全球的 DTC（Direct-to-Consumer）电商 SaaS 平台，类似 Shopify，主要服务东南亚和跨境电商商家。

**Shopline 开放平台**为开发者提供：

| 能力 | 说明 |
|------|------|
| REST Admin API | 操作商品、订单、客户、库存等店铺数据 |
| GraphQL Admin API | 更灵活的数据查询，支持嵌套关联 |
| Storefront API | 面向前端/Headless 场景的只读 API |
| Webhook | 事件驱动，店铺数据变更实时通知 |
| ScriptTag | 向商家店铺注入自定义 JS 脚本 |
| App Bridge | 应用嵌入商家后台的通信桥梁 |
| App Extensions | 在商家后台注入自定义导航/按钮 |
| Shopline CLI 2.0 | 本地开发脚手架和调试工具 |
| Atlas 组件库 | 官方 UI 组件，保持与 Shopline 后台一致的交互风格 |

**官方文档**：https://developer.shopline.com

---

## 2. 注册与环境搭建

### 2.1 注册开发者账号

1. 访问 [Shopline Partner Portal](https://developer.myshopline.com)
2. 点击注册，填写企业或个人信息
3. 验证邮箱后登录

### 2.2 创建开发店铺

开发店铺是免费的测试环境，用于安装和调试你的应用。

1. 登录 Partner Portal → 左侧菜单「商店」
2. 点击「创建开发店铺」
3. 填写店铺名称（如 `my-dev-store`），选择区域
4. 创建完成后你会得到一个 `xxx.myshopline.com` 的店铺域名

### 2.3 创建应用

1. Partner Portal → 左侧菜单「应用」
2. 点击「创建应用」→ 选择 Public Application（公开应用）
3. 填写应用名称
4. 创建后你会获得：
   - **APP Key** — 应用唯一标识
   - **APP Secret** — 用于 OAuth 签名，必须保密

### 2.4 配置应用基本信息

在应用详情页 →「应用设置」中配置：

| 字段 | 示例 |
|------|------|
| 应用地址 | `https://your-app.vercel.app` |
| 授权回调地址 | `https://your-app.vercel.app/api/auth/callback` |
| GDPR Webhook URL | `https://your-app.vercel.app/api/webhook` |

### 2.5 本地环境要求

- Node.js 18+
- npm / yarn / pnpm
- Git

---

## 3. 应用类型

Shopline 提供三种应用分发方式：

| 类型 | 安装范围 | 安装方式 | 授权方式 | 需要审核 | 使用场景 |
|------|---------|---------|---------|---------|---------|
| **Public App** | 所有店铺 | App Store | OAuth 2.0 | 是 | 面向所有商家的通用工具 |
| **Custom App** | 白名单店铺 | 开发者提供链接 | OAuth 2.0 | 否 | 为特定商家定制 |
| **Private App** | 创建者自己的店铺 | 后台直接创建 | Token（后台生成） | 否 | 自用集成 |

**选择建议：**
- 想上架 App Store → Public App
- 为客户做定制开发 → Custom App
- 自己店铺用 → Private App

---

## 4. 开发工具

### 4.1 Shopline CLI 2.0

官方命令行工具，用于项目初始化、本地开发和调试。

```bash
# 安装
npm install -g @shoplinedev/cli

# 初始化新项目
npm create @shoplinedev/app@next

# 启动本地开发（自动 cloudflare tunnel 代理）
cd your-app
npm run dev
```

CLI 会自动：
- 关联 Partner Portal 账号
- 为本地服务创建公网 HTTPS 代理
- 生成应用预览链接
- 同步配置到远程

**常用命令：**

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动本地开发服务 |
| `npm run build` | 编译打包 |
| `shopline app config use` | 切换 TOML 配置文件 |
| `npm run dev -- --reset` | 重置本地缓存 |

> **注意**：已发布的应用不能通过 CLI 本地启动，需要用 `--reset` 创建新开发实例。

### 4.2 Atlas 组件库

Shopline 官方 UI 组件库，保持与商家后台一致的视觉风格：

```bash
npm install @shoplinedev/atlas
```

提供 Button、Input、Table、Modal 等常用组件，适合嵌入式应用开发。

### 4.3 App Bridge

当应用嵌入 Shopline 商家后台 iframe 中运行时，通过 App Bridge 与宿主通信：

```javascript
import { createApp } from '@shoplinedev/app-bridge';

const app = createApp({
  apiKey: 'YOUR_APP_KEY',
  host: window.location.search.get('host'),
});

// 跳转到商家后台页面
app.dispatch('Navigation', { path: '/admin/products' });
```

---

## 5. OAuth 2.0 授权流程

Shopline 的 Public 和 Custom 应用使用标准 OAuth 2.0 授权码模式。

### 流程图

```
商家点击安装 → Shopline 授权页面 → 商家同意 → 回调你的 URL（带 code）→ 换取 accessToken
```

### 5.1 发起授权

当商家安装应用时，Shopline 会重定向到你的应用地址，你需要将商家重定向到 Shopline 授权页面：

```
https://{shop}.myshopline.com/admin/oauth-web/#/oauth/authorize
  ?appKey={APP_KEY}
  &responseType=code
  &scope=read_products,write_products
  &redirectUri={CALLBACK_URL}
```

### 5.2 处理回调（Next.js 示例）

```typescript
// src/app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code') || '';
  const shop = req.nextUrl.searchParams.get('handle') || '';

  // 用 code 换 accessToken
  const response = await fetch(
    `https://${shop}.myshopline.com/admin/oauth/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appKey: process.env.SHOPLINE_APP_KEY,
        appSecret: process.env.SHOPLINE_APP_SECRET,
        code,
        grantType: 'authorization_code',
      }),
    }
  );

  const data = await response.json();
  const accessToken = data.access_token;
  // accessToken 有效期 10 小时，需要定期用 refresh_token 刷新

  // 保存 token，重定向到应用 Dashboard
  return NextResponse.redirect(`${process.env.APP_URL}/dashboard?shop=${shop}`);
}
```

### 5.3 刷新 Token

accessToken 有效期 10 小时，到期前需要刷新：

```typescript
const response = await fetch(
  `https://${shop}.myshopline.com/admin/oauth/token`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appKey: process.env.SHOPLINE_APP_KEY,
      appSecret: process.env.SHOPLINE_APP_SECRET,
      refreshToken: savedRefreshToken,
      grantType: 'refresh_token',
    }),
  }
);
```

> **注意**：刷新后旧 accessToken 在 5 分钟内仍有效（平滑过渡）。

---

## 6. 核心 API 能力

### 6.1 REST Admin API

版本化管理，URL 中带版本号。当前推荐版本：`v20240301`。

**请求格式：**
```
GET https://{shop}.myshopline.com/admin/openapi/v20240301/{resource}.json
Authorization: Bearer {accessToken}
```

**主要资源域：**

| 资源域 | 端点示例 | 能力 |
|--------|---------|------|
| Products | `/products/products.json` | 商品 CRUD、变体、图片 |
| Orders | `/orders/list.json` | 订单查询、发货、退款 |
| Customers | `/customers/list.json` | 客户信息管理 |
| Inventory | `/inventory/list.json` | 库存查询与调整 |
| ScriptTag | `/scripttags.json` | 注入自定义 JS |
| Webhook | `/webhooks.json` | 订阅/管理 webhook |
| Collection | `/collections/list.json` | 商品集合管理 |
| Discount | `/discounts/list.json` | 折扣码管理 |

**示例：查询商品列表**

```bash
curl -X GET \
  'https://mystore.myshopline.com/admin/openapi/v20240301/products/products.json?pageSize=10' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

**Node.js 封装：**

```typescript
async function shoplineAPI(shop: string, token: string, endpoint: string) {
  const res = await fetch(
    `https://${shop}.myshopline.com/admin/openapi/v20240301/${endpoint}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.json();
}

// 使用
const products = await shoplineAPI('mystore', token, 'products/products.json?pageSize=10');
```

### 6.2 GraphQL Admin API

更灵活的查询方式，支持嵌套关联、分页、字段筛选：

```bash
curl -X POST \
  'https://mystore.myshopline.com/admin/openapi/graphql.json' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "{ products(first: 10) { edges { node { id title variants { edges { node { price } } } } } } }"
  }'
```

**适用场景：**
- 需要一次性获取多层嵌套数据（商品+变体+库存）
- 只需要部分字段，减少传输量
- 复杂筛选和排序

### 6.3 Storefront API

面向前端 / Headless Commerce 场景的只读 API，不需要后台 accessToken，使用 Storefront Token：

```bash
curl -X POST \
  'https://mystore.myshopline.com/storefront/openapi/graphql.json' \
  -H 'X-Shopline-Storefront-Access-Token: YOUR_STOREFRONT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{ "query": "{ products(first: 5) { edges { node { title handle } } } }" }'
```

### 6.4 API 版本管理

Shopline 通过滑动窗口维护 8 个 API 版本，命名规则为 `vYYYYMMDD`（如 `v20240301`）。

- 每 3 个月发布新版本
- 旧版本在 24 个月后废弃
- 建议使用最新稳定版

---

## 7. Webhook 事件订阅

### 7.1 概述

当店铺数据变更时（如新订单、商品更新），Shopline 通过 HTTP POST 主动通知你的服务器。

### 7.2 订阅方式

**方式一：API 注册**

```typescript
async function registerWebhook(shop: string, token: string, topic: string, url: string) {
  await fetch(
    `https://${shop}.myshopline.com/admin/openapi/v20240301/webhooks.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: { topic, address: url, format: 'json' },
      }),
    }
  );
}

// 注册商品创建事件
await registerWebhook(shop, token, 'product/created', 'https://your-app.com/api/webhook');
```

**方式二：Developer Center 手动配置**

在 Partner Portal → 应用 → Webhook 设置中手动添加。

### 7.3 常用事件

| 主题 | 说明 |
|------|------|
| `product/created` | 商品创建 |
| `product/updated` | 商品更新 |
| `order/created` | 新订单 |
| `order/paid` | 订单付款 |
| `order/fulfilled` | 订单发货 |
| `app/uninstalled` | 应用被卸载 |
| `appsubscription/create` | 订阅创建 |
| `appsubscription/expired` | 订阅过期 |
| `customer/created` | 新客户 |
| `inventory/updated` | 库存变更 |

### 7.4 Webhook 请求格式

**请求头：**

| Header | 说明 |
|--------|------|
| `x-shopline-topic` | 事件主题（如 `product/created`） |
| `x-shopline-shop-domain` | 店铺域名 |
| `x-shopline-hmac-sha256` | HMAC 签名（用 APP Secret 验证） |
| `x-shopline-api-version` | API 版本 |

**签名验证（Next.js 示例）：**

```typescript
import crypto from 'crypto';

function verifyWebhook(body: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body, 'utf-8');
  const digest = hmac.digest('base64');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

### 7.5 处理 Webhook（Next.js 示例）

```typescript
// src/app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const topic = req.headers.get('x-shopline-topic') || '';
  const shopDomain = req.headers.get('x-shopline-shop-domain') || '';
  const signature = req.headers.get('x-shopline-hmac-sha256') || '';

  // 验证签名
  if (!verifyWebhook(body, signature, process.env.SHOPLINE_APP_SECRET!)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const data = JSON.parse(body);

  switch (topic) {
    case 'product/created':
      console.log(`New product in ${shopDomain}:`, data.title);
      break;
    case 'order/created':
      console.log(`New order #${data.orderNumber} in ${shopDomain}`);
      break;
    case 'app/uninstalled':
      // 清理该店铺的数据
      break;
  }

  return NextResponse.json({ ok: true });
}
```

---

## 8. 应用扩展能力

### 8.1 ScriptTag — 注入 JS 到店铺前端

ScriptTag 允许你在商家店铺的每个页面加载自定义 JS（如追踪像素、悬浮客服组件等）：

```typescript
async function createScriptTag(shop: string, token: string, src: string) {
  await fetch(
    `https://${shop}.myshopline.com/admin/openapi/v20240301/scripttags.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scriptTag: { event: 'onload', src },
      }),
    }
  );
}
```

### 8.2 Admin Link — 在商家后台添加入口

在 Partner Portal →「应用扩展」中配置，可以在商家后台的商品列表页等位置添加快捷链接到你的应用。

### 8.3 App Bridge — 嵌入式应用通信

当应用以 iframe 嵌入商家后台时，使用 App Bridge 实现：
- 页面导航
- Toast 通知
- Modal 弹窗
- 获取当前店铺信息

---

## 9. Demo：商品库存预警应用（Next.js）

一个完整的示例应用：当商品库存低于阈值时，在 Dashboard 中显示预警列表。

### 9.1 项目结构

```
stock-alert-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── callback/route.ts   # OAuth 回调
│   │   │   ├── webhook/route.ts         # 接收库存变更通知
│   │   │   └── cron/route.ts            # 定时检查库存
│   │   ├── dashboard/page.tsx           # 预警面板
│   │   ├── layout.tsx
│   │   └── page.tsx                     # 安装引导
│   └── lib/
│       ├── shopline-api.ts              # API 封装
│       ├── shop.ts                      # 数据存储
│       └── redis.ts                     # Upstash Redis
├── .env.local
├── package.json
└── next.config.ts
```

### 9.2 核心代码

**`src/lib/shopline-api.ts` — API 封装层**

```typescript
const API_VERSION = 'v20240301';

export async function exchangeCodeForToken(shop: string, code: string) {
  const res = await fetch(`https://${shop}.myshopline.com/admin/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appKey: process.env.SHOPLINE_APP_KEY,
      appSecret: process.env.SHOPLINE_APP_SECRET,
      code,
      grantType: 'authorization_code',
    }),
  });
  const data = await res.json();
  return data.access_token;
}

export async function getProducts(shop: string, token: string) {
  const res = await fetch(
    `https://${shop}.myshopline.com/admin/openapi/${API_VERSION}/products/products.json?pageSize=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.json();
}

export async function registerWebhook(shop: string, token: string, topic: string, url: string) {
  await fetch(
    `https://${shop}.myshopline.com/admin/openapi/${API_VERSION}/webhooks.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ webhook: { topic, address: url, format: 'json' } }),
    }
  );
}
```

**`src/app/api/auth/callback/route.ts` — OAuth 回调**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, registerWebhook } from '@/lib/shopline-api';
import { saveShopToken } from '@/lib/shop';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code') || '';
  const shop = req.nextUrl.searchParams.get('handle') || '';

  if (!code || !shop) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const accessToken = await exchangeCodeForToken(shop, code);
  await saveShopToken(shop, accessToken);

  // 注册库存变更 webhook
  const webhookUrl = `${process.env.APP_URL}/api/webhook`;
  await registerWebhook(shop, accessToken, 'inventory/updated', webhookUrl);
  await registerWebhook(shop, accessToken, 'app/uninstalled', webhookUrl);

  return NextResponse.redirect(`${process.env.APP_URL}/dashboard?shop=${shop}`);
}
```

**`src/app/api/webhook/route.ts` — 库存变更处理**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { saveAlert, deleteShopData } from '@/lib/shop';

export async function POST(req: NextRequest) {
  const topic = req.headers.get('x-shopline-topic') || '';
  const shopDomain = req.headers.get('x-shopline-shop-domain') || '';
  const shopId = shopDomain.replace('.myshopline.com', '');
  const body = await req.json();

  switch (topic) {
    case 'inventory/updated': {
      // 库存低于阈值（默认 5）时保存预警
      const threshold = 5;
      if (body.available !== undefined && body.available <= threshold) {
        await saveAlert(shopId, {
          productId: body.productId,
          variantId: body.variantId,
          available: body.available,
          updatedAt: Date.now(),
        });
      }
      break;
    }
    case 'app/uninstalled': {
      await deleteShopData(shopId);
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
```

**`src/app/dashboard/page.tsx` — 预警面板**

```typescript
import { getShopAlerts } from '@/lib/shop';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string }>;
}) {
  const { shop = '' } = await searchParams;

  if (!shop) {
    return <p>Missing shop parameter.</p>;
  }

  const alerts = await getShopAlerts(shop);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Stock Alerts</h1>

      {alerts.length === 0 ? (
        <p className="text-gray-500">All products have sufficient stock.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Product</th>
              <th className="text-left py-2">Variant</th>
              <th className="text-left py-2">Stock</th>
              <th className="text-left py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert, i) => (
              <tr key={i} className="border-b">
                <td className="py-2">{alert.productId}</td>
                <td className="py-2">{alert.variantId}</td>
                <td className="py-2 text-red-600 font-bold">{alert.available}</td>
                <td className="py-2 text-sm text-gray-500">
                  {new Date(alert.updatedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

### 9.3 环境变量

```env
SHOPLINE_APP_KEY=your_app_key
SHOPLINE_APP_SECRET=your_app_secret
APP_URL=https://your-app.vercel.app
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

### 9.4 部署

```bash
# 安装依赖
npm install next react react-dom @upstash/redis

# 本地开发
npm run dev

# 部署到 Vercel
npx vercel --prod
```

部署后在 Partner Portal 中将应用地址和回调地址更新为 Vercel URL。

---

## 10. 上架与审核

### 10.1 审核前准备清单

| 项目 | 要求 |
|------|------|
| OAuth 授权 | 必须实现标准 OAuth 2.0 流程 |
| GDPR Webhook | 必须提供有效的 GDPR webhook URL |
| 隐私政策 | 必须提供可访问的隐私政策页面 URL |
| FAQ | 必须提供 FAQ 页面 URL |
| 应用图标 | 120×120px，JPG/PNG，≤2M |
| 截图 | 1920×1080，JPG/PNG，≤5M，最多 9 张 |
| 应用描述 | 须与实际功能一致，支持多语言 |
| 测试信息 | 提供测试账号或勾选"无需账号" |

### 10.2 提交流程

1. Partner Portal → 应用 →「应用详情」
2. 在多语言列表中点击对应语言，填写：
   - 应用描述、Logo、截图
   - 隐私政策 URL、FAQ URL
   - 联系方式
3. 填写测试信息（操作说明）
4. 点击「提交审核」

### 10.3 审核时间

- 工作日审核：10:00–18:00（GMT+8）
- 审核周期：7 个工作日
- 结果通过邮件通知

### 10.4 常见驳回原因

- OAuth 授权异常
- 缺少隐私政策或 FAQ
- 截图模糊/拉伸
- 应用功能描述与实际不符
- 缺少 GDPR mandatory webhook
- 测试账号无法登录

---

## 附录：有用链接

| 资源 | URL |
|------|-----|
| 开发者文档 | https://developer.shopline.com |
| Partner Portal | https://developer.myshopline.com |
| REST API 参考 | https://developer.shopline.com/docs/admin-rest-api/ |
| GraphQL API | https://developer.shopline.com/docs/admin-graph-ql-api/schema-documentation |
| Webhook 文档 | https://developer.shopline.com/docs/webhook/ |
| Shopline CLI npm | https://www.npmjs.com/package/@shoplinedev/cli |
| 审核标准 | https://developer.shopline.com/docs/apps/application-management/shopline-app-review-standards |
| Atlas 组件库 | @shoplinedev/atlas（npm） |

---

*Last updated: 2026-07-08*
