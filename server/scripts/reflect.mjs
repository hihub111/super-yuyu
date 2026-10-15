// 教学反思回灌：把课程的教学反思摄入课程库语料
// 用法: node scripts/reflect.mjs --course <courseId>
import { db } from '../src/db/index.js';
import { saveChunks } from '../src/rag/store.js';

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : null;
}

const id = arg('course');
if (!id) {
  console.error('用法: node scripts/reflect.mjs --course <courseId>');
  process.exit(1);
}

try {
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
  if (!course) throw new Error('课程不存在');
  const plan = JSON.parse(course.plan_json || '{}');
  const reflection = (plan.教学反思 || '').trim();
  if (!reflection) {
    console.log('⚠ 该课程还没有教学反思（先上课，再回来填）');
    process.exit(0);
  }

  // 反思作为独立 chunk 入库：source 用课程标题，便于追溯
  const packageId = `reflection-${id}`;
  db.prepare('DELETE FROM chunks WHERE package_id = ?').run(packageId);
  await saveChunks(packageId, course.course_type, [
    { section: '教学反思', content: `【教学反思｜${course.title}（${course.course_type}课，${course.grade_range}年级）】\n${reflection}` },
  ]);
  db.prepare(
    `INSERT INTO corpus_packages (id, name, course_type, source_hash, chunk_count)
     VALUES (?, ?, ?, 'manual-reflection', 1)
     ON CONFLICT(id) DO UPDATE SET chunk_count = 1, ingested_at = datetime('now')`
  ).run(packageId, `教学反思·${course.title}`, course.course_type);
  console.log(`✔ 教学反思已摄入课程库：${course.title}`);
} catch (e) {
  console.error('❌ 回灌失败:', e.message);
  process.exit(1);
}
