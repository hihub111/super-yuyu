import { Router } from 'express';
import { db } from '../db/index.js';
import { config } from '../config.js';
import {
  SESSION_COOKIE,
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
  requireAuth,
} from '../auth.js';

export const authRouter = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: config.sessionTtlDays * 24 * 3600 * 1000,
};

// 注册（学号 + 邀请码，团队内部）
authRouter.post('/register', (req, res) => {
  const { studentId, password, displayName, inviteCode } = req.body || {};
  if (typeof studentId !== 'string' || !/^[A-Za-z0-9]{4,20}$/.test(studentId)) {
    return res.status(400).json({ error: '学号格式不正确（4-20 位字母或数字）' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: '密码至少 6 位' });
  }
  if (!displayName || !String(displayName).trim()) {
    return res.status(400).json({ error: '请填写姓名' });
  }
  if (!config.inviteCode || inviteCode !== config.inviteCode) {
    return res.status(403).json({ error: '邀请码不正确' });
  }
  const exists = db.prepare('SELECT id FROM users WHERE student_id = ?').get(studentId);
  if (exists) return res.status(409).json({ error: '该学号已注册，请直接登录' });

  const info = db
    .prepare('INSERT INTO users (student_id, password_hash, display_name) VALUES (?, ?, ?)')
    .run(studentId, hashPassword(password), String(displayName).trim());

  const { token } = createSession(info.lastInsertRowid);
  res.cookie(SESSION_COOKIE, token, COOKIE_OPTS);
  res.json({ user: { id: info.lastInsertRowid, studentId, displayName: String(displayName).trim(), role: 'teacher' } });
});

// 登录
authRouter.post('/login', (req, res) => {
  const { studentId, password } = req.body || {};
  const row = db.prepare('SELECT * FROM users WHERE student_id = ?').get(studentId);
  if (!row || !verifyPassword(password || '', row.password_hash)) {
    return res.status(401).json({ error: '学号或密码不正确' });
  }
  const { token } = createSession(row.id);
  res.cookie(SESSION_COOKIE, token, COOKIE_OPTS);
  res.json({ user: { id: row.id, studentId: row.student_id, displayName: row.display_name, role: row.role } });
});

// 登出
authRouter.post('/logout', requireAuth, (req, res) => {
  deleteSession(req.cookies[SESSION_COOKIE]);
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ ok: true });
});

// 当前用户（前端启动时恢复会话）
authRouter.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});
