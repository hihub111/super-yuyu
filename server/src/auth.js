import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from './db/index.js';
import { config } from './config.js';

export const SESSION_COOKIE = 'yuyu_session';

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(
    Date.now() + config.sessionTtlDays * 24 * 3600 * 1000
  ).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(
    token, userId, expiresAt
  );
  return { token, expiresAt };
}

export function deleteSession(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// 登录态中间件：读 cookie → 查 session → 注入 req.user
export function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return res.status(401).json({ error: '未登录' });
  const row = db
    .prepare(
      `SELECT s.expires_at, u.id, u.student_id, u.display_name, u.role
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .get(token);
  if (!row || new Date(row.expires_at) < new Date()) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
  req.user = {
    id: row.id,
    studentId: row.student_id,
    displayName: row.display_name,
    role: row.role,
  };
  next();
}
