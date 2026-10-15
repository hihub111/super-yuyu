# yuyu · 支教课程设计助手

琼台师范学院「语绘童心，绿耀琼乡」志愿实践团的 **AI 课程设计 Agent**。

支教老师在假期乡村营开课前夜，把课程想法告诉yuyu，yuyu基于团队课程库生成四件套：

1. **教案骨架**（教学设计，团队标准模板 13 板块）
2. **逐字稿**（教师台词脚本：PPT 页标记、舞台指示、口令呼应、混龄分层提问）
3. **物料清单**（教师教具 / 学生材料 / 替代品建议）
4. **安全预案**（五块必填：人员分工 / 课前准备 / 课堂管控 / 突发应急 / 课后收尾）

面向 **1-6 年级混龄乡村课堂**，每份产出都符合《教师语言规范》（`server/prompts/teacher-language.md`，师范生可直接编辑，零代码生效）。

## 快速开始

```bash
# 1. 安装依赖
npm install
cd server && npm install && cd ..

# 2. 配置 server/.env（模板见 server/.env.example）
#    DEEPSEEK_API_KEY  必填（生成模型）
#    SILICONFLOW_API_KEY  推荐（RAG 中文嵌入，注册：cloud.siliconflow.cn）
#    TEAM_INVITE_CODE  必填（团队注册邀请码）

# 3. 启动后端（端口 3000）
cd server && npm run dev

# 4. 启动前端（端口 5173，/api 自动代理到 3000）
npm run dev
```

浏览器打开 http://localhost:5173，用学号 + 邀请码注册登录。

## 语料摄取（RAG）

```bash
# 把课程包（教案 .docx + 逐字稿 .md）放进 server/corpus/<课程名>/，然后：
cd server
node scripts/ingest.mjs --dir corpus/风车 --type 科学 --name 风车

# 上完课后，把教学反思回流进课程库：
node scripts/reflect.mjs --course <课程ID>

# 无 embedding key 时可用离线伪向量验证管线（相关性弱，仅测试）：
EMBED_PROVIDER=pseudo node scripts/ingest.mjs --dir corpus/风车 --type 科学 --name 风车 --force
```

## MCP 使用

技能（检索 / 教案生成 / 逐字稿生成 / 物料清单 / 安全预案）以 MCP 工具暴露，Claude Desktop 配置：

```json
{
  "mcpServers": {
    "yuyu": {
      "command": "node",
      "args": ["/绝对路径/server/src/mcp/index.js"]
    }
  }
}
```

## 架构

- 前端：Vue 3 + vue-router + Tailwind v4（src/），登录 / 课程工作台 / 分步生成编辑器
- 后端：Express 5 + better-sqlite3（server/src/），DeepSeek function-calling 手写 agent 循环
- RAG：SiliconFlow BGE-M3 中文嵌入 + SQLite 暴力余弦检索（server/src/rag/）
- Skills：纯函数 + zod 参数，双通道（内部 agent 循环 + MCP stdio 服务器）

详见 `CLAUDE.md`。

## 部署与内网穿透

生产模式单端口运行（Express 直接托管前端构建产物 + API）：

```bash
npm run build          # 生成 dist/
cd server && npm start # 只开这一个端口：http://localhost:3000
```

穿透/上云都只需暴露 **3000 一个端口**（登录、生成、SSE 全部同源）：

- **花生壳**（试用）：下载客户端 → 内网穿透 → 添加映射（内网主机 `127.0.0.1`，端口 `3000`，类型 HTTP/HTTPS）→ 把生成的访问域名发给队友。电脑保持开机联网。
- **cpolar**：同上，免费版 1Mbps，域名随机。
- **云服务器**（正式使用）：`npm run build` + 拷贝 `server/`（含 `dist/`）+ `npm install` + `node src/index.js`，注意把 `server/data/yuyu.db` 和语料一并拷贝。

暴露公网前请确认：
1. `TEAM_INVITE_CODE` 已改成非默认值（`server/.env`）
2. 登录接口已有限速（每 IP 15 分钟 10 次失败）
3. 建议通过 HTTPS 链接访问（花生壳免费提供 HTTPS 域名）

## 数据与备份

- 数据库：`server/data/yuyu.db`（SQLite 单文件，gitignored）——备份直接复制该文件
- 语料：`server/corpus/`（gitignored），从团队网盘同步

## 团队

琼台师范学院 · 语绘童心志愿服务团
