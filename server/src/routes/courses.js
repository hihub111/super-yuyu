import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/index.js';
import { requireAuth } from '../auth.js';

export const coursesRouter = Router();
coursesRouter.use(requireAuth);

const STATUS_RANK = { draft: 1, plan_confirmed: 2, done: 3 };

// 字段白名单：前端字段名 → 数据库列名
const EDITABLE = {
  title: 'title',
  courseType: 'course_type',
  gradeRange: 'grade_range',
  meta: 'meta',
  planJson: 'plan_json',
  scriptMd: 'script_md',
  materialsJson: 'materials_json',
  safetyJson: 'safety_json',
  status: 'status',
};

function rowToCourse(row, { full = false } = {}) {
  const c = {
    id: row.id,
    title: row.title,
    courseType: row.course_type,
    gradeRange: row.grade_range,
    status: row.status,
    isShared: !!row.is_shared,
    updatedAt: row.updated_at,
  };
  if (row.owner_name !== undefined) c.ownerName = row.owner_name;
  if (full) {
    c.meta = JSON.parse(row.meta || '{}');
    c.planJson = JSON.parse(row.plan_json || '{}');
    c.scriptMd = row.script_md || '';
    c.materialsJson = row.materials_json ? JSON.parse(row.materials_json) : null;
    c.safetyJson = row.safety_json ? JSON.parse(row.safety_json) : null;
  }
  return c;
}

// 列表：我的课程 / 团队课程库（不返回大字段）
coursesRouter.get('/', (req, res) => {
  if (req.query.shared === '1') {
    const rows = db
      .prepare(
        `SELECT c.*, u.display_name AS owner_name FROM courses c
         JOIN users u ON u.id = c.owner_id
         WHERE c.is_shared = 1 ORDER BY c.updated_at DESC`
      )
      .all();
    return res.json(rows.map((r) => rowToCourse(r)));
  }
  const rows = db
    .prepare('SELECT * FROM courses WHERE owner_id = ? ORDER BY updated_at DESC')
    .all(req.user.id);
  res.json(rows.map((r) => rowToCourse(r)));
});

// 新建课程（也用于「复制到我的课程」：可直接带内容字段）
coursesRouter.post('/', (req, res) => {
  const { title, courseType, gradeRange, meta, planJson, scriptMd, materialsJson, safetyJson } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: '请填写课目' });
  if (!courseType) return res.status(400).json({ error: '请选择课程类型' });

  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO courses (id, owner_id, title, course_type, grade_range, meta, plan_json, script_md, materials_json, safety_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    req.user.id,
    String(title).trim(),
    courseType,
    gradeRange || '1-6',
    JSON.stringify(meta || {}),
    JSON.stringify(planJson || {}),
    scriptMd || null,
    materialsJson ? JSON.stringify(materialsJson) : null,
    safetyJson ? JSON.stringify(safetyJson) : null
  );
  const row = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
  res.json(rowToCourse(row, { full: true }));
});

// 详情：owner 或共享课程可读
coursesRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '课程不存在' });
  if (row.owner_id !== req.user.id && !row.is_shared) {
    return res.status(403).json({ error: '无权查看该课程' });
  }
  res.json(rowToCourse(row, { full: true }));
});

// 更新：字段子集 + status 合法迁移校验
coursesRouter.put('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '课程不存在' });
  if (row.owner_id !== req.user.id) return res.status(403).json({ error: '只能编辑自己的课程' });

  const sets = [];
  const values = [];
  for (const [field, value] of Object.entries(req.body || {})) {
    const col = EDITABLE[field];
    if (!col) continue;
    if (field === 'status') {
      const to = STATUS_RANK[value];
      const from = STATUS_RANK[row.status];
      if (!to) return res.status(400).json({ error: '非法的课程状态' });
      if (to < from) return res.status(400).json({ error: '课程状态不能回退' });
    }
    sets.push(`${col} = ?`);
    values.push(typeof value === 'object' && value !== null ? JSON.stringify(value) : value);
  }
  if (!sets.length) return res.status(400).json({ error: '没有可更新的字段' });
  sets.push(`updated_at = datetime('now')`);
  db.prepare(`UPDATE courses SET ${sets.join(', ')} WHERE id = ?`).run(...values, req.params.id);

  const updated = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  res.json(rowToCourse(updated, { full: true }));
});

// 删除
coursesRouter.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '课程不存在' });
  if (row.owner_id !== req.user.id) return res.status(403).json({ error: '只能删除自己的课程' });
  db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// 分享 / 撤回分享到团队课程库
coursesRouter.post('/:id/share', (req, res) => {
  const row = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '课程不存在' });
  if (row.owner_id !== req.user.id) return res.status(403).json({ error: '只能分享自己的课程' });
  const shared = req.body?.shared ? 1 : 0;
  db.prepare(`UPDATE courses SET is_shared = ?, updated_at = datetime('now') WHERE id = ?`).run(shared, req.params.id);
  res.json({ ok: true, isShared: !!shared });
});
