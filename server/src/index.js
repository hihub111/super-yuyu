import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { coursesRouter } from './routes/courses.js';
import { generateRouter } from './routes/generate.js';

const app = express();
// 前后端同源（vite 代理 / 生产模式 Express 直接托管 dist），无需 CORS
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/generate', generateRouter);

app.use('/api', (req, res) => res.status(404).json({ error: '接口不存在' }));

// 生产模式：托管前端构建产物（npm run build → dist），单端口 3000 即完整服务
const distDir = path.resolve(config.serverRoot, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  // SPA 兜底：非 /api 的 GET 一律回 index.html（vue-router history 模式）
  app.use((req, res, next) => {
    if (req.method === 'GET') return res.sendFile(path.join(distDir, 'index.html'));
    next();
  });
  console.log(`前端构建产物已挂载: ${distDir}`);
} else {
  console.log('未检测到 dist/（开发模式请用 vite :5173），仅提供 API');
}

// 兜底错误处理
app.use((err, req, res, next) => {
  console.error('服务端错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(config.port, () => {
  console.log(`语语后端已就绪: http://localhost:${config.port}`);
  console.log(`数据库: ${config.dbPath}`);
});
