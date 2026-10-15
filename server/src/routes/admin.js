import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireAdmin } from '../auth.js';

// 管理员接口（需要登录 + admin 角色）
export const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

// 成员列表
adminRouter.get('/users', (req, res) => {
  const rows = db
    .prepare('SELECT id, student_id, display_name, role, created_at FROM users ORDER BY created_at')
    .all();
  res.json(
    rows.map((r) => ({
      id: r.id,
      studentId: r.student_id,
      displayName: r.display_name,
      role: r.role,
      createdAt: r.created_at,
    }))
  );
});
