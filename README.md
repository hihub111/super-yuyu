# Super YuYu / 语语

情感关怀 AI 数字人，用温暖和陪伴守护每一份童真。

## 功能

- **情绪选择** — 点击 YuYu 身边的情绪按钮，告诉它你今天的心情
- **AI 对话** — 基于 DeepSeek 的流式对话，YuYu 会根据你的情绪调整语气和回应方式
- **情绪日志** — 记录心事卡片，保存在浏览器本地

## 技术栈

| 前端 | 后端 |
|------|------|
| Vue 3 + Vite | Node.js + Express |
| Tailwind CSS v4 | DeepSeek API (OpenAI 兼容) |
| Lucide Icons | SSE 流式响应 |

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/Hihub111/super-yuyu.git
cd super-yuyu

# 2. 安装依赖
npm install
cd server && npm install && cd ..

# 3. 配置 API Key
cp server/.env.example server/.env
# 编辑 server/.env，填入你的 DeepSeek API Key

# 4. 启动后端（终端1）
node server/server.js

# 5. 启动前端（终端2）
npm run dev

# 6. 浏览器打开 http://localhost:5173
```

## DeepSeek API Key 获取

在 [DeepSeek 开放平台](https://platform.deepseek.com/api_keys) 注册并创建 API Key，填入 `server/.env`。

## 项目结构

```
super-yuyu/
├── src/
│   ├── App.vue          # 主界面（对话、情绪、菜单、日志）
│   ├── main.js          # Vue 入口
│   ├── style.css        # Tailwind 全局样式
│   └── assets/          # 图片素材
├── server/
│   ├── server.js        # Express API 服务
│   └── .env             # API Key（需自行创建）
├── public/
│   └── yuyu-1.mp4       # YuYu 动画
├── package.json
└── vite.config.js
```

## 关于我们

语绘支教团队（蔚蓝师语实践团）隶属琼台师范学院团委，以"语绘童心，绿耀琼乡"为使命，将优质教育、海南少数民族文化与生态保护融入支教课堂，服务超 250 名乡村学生。

关注我们：

- **微信公众号**：搜索 `gh_b11ee5c74a33`
- **抖音**：打开抖音搜索 🔍 语绘团队
