# 语语 · 支教课程设计助手

琼台师范学院「语绘童心，绿耀琼乡」志愿实践团的 **AI 课程设计 Agent**。

支教老师在假期乡村营开课前夜，把课程想法告诉语语，语语基于团队课程库生成四件套：

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

## 数据与备份

- 数据库：`server/data/yuyu.db`（SQLite 单文件，gitignored）——备份直接复制该文件
- 语料：`server/corpus/`（gitignored），从团队网盘同步

## 团队

琼台师范学院 · 语绘童心志愿服务团
