import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { db } from '../db/index.js';
import { parseDocx } from './parseDocx.js';
import { parseMd } from './parseMd.js';
import { clearPackage, saveChunks } from './store.js';

// 摄取一个课程包目录 → 解析 → 分块 → 嵌入 → 入库（幂等：内容未变则跳过）
export async function ingest({ dir, type, name, force = false }) {
  const files = (await fs.readdir(dir)).filter((f) => !f.startsWith('~$')).sort();

  // source_hash：目录内所有文件 mtime+size 摘要（幂等依据）
  const parts = [];
  for (const f of files) {
    const st = await fs.stat(path.join(dir, f));
    if (st.isFile()) parts.push(`${f}:${Math.round(st.mtimeMs)}:${st.size}`);
  }
  const hash = crypto.createHash('md5').update(parts.join('|')).digest('hex');

  const existing = db.prepare('SELECT source_hash FROM corpus_packages WHERE id = ?').get(name);
  if (existing && existing.source_hash === hash && !force) {
    console.log(`⏭  ${name} 内容未变化，跳过（--force 可重摄）`);
    return 0;
  }

  // 解析
  let chunks = [];
  for (const f of files) {
    const p = path.join(dir, f);
    if (f.endsWith('.docx')) {
      chunks.push(...(await parseDocx(p)));
    } else if (f.endsWith('.md')) {
      chunks.push(...parseMd(await fs.readFile(p, 'utf8')));
    } else if (f.endsWith('.pptx')) {
      console.log(`  ℹ ${f}（pptx 暂不提取，MVP 跳过）`);
    }
  }
  if (!chunks.length) {
    console.log(`⚠  ${name} 未解析出任何内容`);
    return 0;
  }

  clearPackage(name);
  const count = await saveChunks(name, type, chunks);
  db.prepare(
    `INSERT INTO corpus_packages (id, name, course_type, source_hash, chunk_count)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET source_hash = excluded.source_hash,
       chunk_count = excluded.chunk_count, ingested_at = datetime('now')`
  ).run(name, name, type, hash, count);

  // 打印摘要表供人工抽查（Phase 2 验收关卡）
  console.log(`✔  ${name}（${type}）：${count} chunks`);
  const summary = {};
  for (const c of chunks) summary[c.section] = (summary[c.section] || 0) + 1;
  console.log(`   板块分布: ${JSON.stringify(summary)}`);
  return count;
}
