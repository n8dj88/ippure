# IPPure - IP纯净度检测平台

专业IP纯净度检测网站，支持IP检测、出口检测、VPN溯源、浏览器指纹检测等功能。

## 功能特性

- **IP检测** - 多数据源验证，获取准确IP定位信息
- **IP出口检测** - 全面检测IP出口分布，在地图上显示出口IP分布
- **VPN溯源** - 检测VPN泄露风险
- **WebRTC泄露检测** - 检测WebRTC是否暴露真实IP
- **DNS泄露检测** - 检测DNS解析是否泄露隐私
- **浏览器指纹检测** - 检测浏览器指纹信息
- **网上邻居** - 检测同IP段下的其他服务
- **IP信息卡片** - 生成访客IP信息卡片图片
- **API接口** - 提供公开API供开发者使用

## 技术栈

- Cloudflare Workers
- TypeScript
- Wrangler CLI

## 部署方式

### GitHub集成部署

1. **连接Cloudflare Workers**
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 进入 **Workers & Pages**
   - 点击 **Create application** → **Create Worker**
   - 选择 **Deploy from GitHub**
   - 授权GitHub仓库访问
   - 选择仓库和分支（main）
   - 配置构建命令：`npm run build`
   - 设置入口文件：`src/index.ts`

2. **配置自定义域名（可选）**
   - 在 Workers & Pages 设置中点击 **Triggers**
   - 点击 **Add Custom Domain**
   - 输入您的域名并验证

### 方式二：Wrangler CLI 部署

```bash
# 安装依赖
npm install

# 登录Cloudflare
npx wrangler login

# 部署
npm run deploy
```

## 本地开发

```bash
# 安装依赖
npm install

# 本地开发
npm run dev
```

访问 `http://localhost:8787` 查看效果。

## API接口

### 获取IP信息

```bash
curl -L https://your-domain.com/v1/info
```

返回示例：

```json
{
  "ip": "104.28.123.123",
  "asn": 13335,
  "asOrganization": "Cloudflare, Inc.",
  "country": "United States",
  "countryCode": "US",
  "region": "California",
  "regionCode": "CA",
  "city": "Los Angeles",
  "timezone": "America/Los_Angeles",
  "longitude": "-118.24368",
  "latitude": "34.05223",
  "postalCode": "90012",
  "fraudScore": 75,
  "isResidential": false,
  "isBroadcast": false,
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}
```

### 获取IP信息卡片

```bash
curl -L https://your-domain.com/v1/card
```

## 页面路由

| 页面 | 路由 |
|------|------|
| IP检测（首页） | `/` |
| IP出口检测 | `/IP-Outbound-Detect.html` |
| VPN溯源 | `/IP-leak-Detect.html` |
| WebRTC泄露检测 | `/Browser-WebRTC-Leak-Detect.html` |
| DNS泄露检测 | `/DNS-Leak-Detect.html` |
| 指纹检测 | `/fingerprint.html` |
| 网上邻居 | `/neighbors.html` |
| IP信息卡片 | `/MyIP-Info-Card.html` |
| API接口 | `/MyIP-Info-API.html` |
| 关于本站 | `/about.html` |
| 常见问题 | `/faq.html` |
| 数据纠正记录 | `/correction.html` |
| 功能更新日志 | `/changelog.html` |
| 联系方式 | `/contact.html` |
| 使用条款与隐私 | `/terms-privacy.html` |

## 项目结构

```
ippure/
├── src/
│   └── index.ts          # Cloudflare Worker 主文件
├── public/               # 静态资源目录
├── package.json          # 项目依赖
├── tsconfig.json         # TypeScript 配置
├── wrangler.toml         # Cloudflare Workers 配置
└── README.md             # 项目说明文档
```

## 数据来源

IPPure整合多个IP数据源，包括：

- IP2Location
- DB-IP
- MaxMind
- IPIP

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过 [Issues](https://github.com/YOUR_USERNAME/ippure/issues) 反馈。