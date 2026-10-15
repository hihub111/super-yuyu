import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { coursesRouter } from './routes/courses.js';
import { generateRouter } from './routes/generate.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/generate', generateRouter);

app.use('/api', (req, res) => res.status(404).json({ error: '接口不存在' }));

// 兜底错误处理
app.use((err, req, res, next) => {
  console.error('服务端错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(config.port, () => {
  console.log(`语语后端已就绪: http://localhost:${config.port}`);
  console.log(`数据库: ${config.dbPath}`);
});
