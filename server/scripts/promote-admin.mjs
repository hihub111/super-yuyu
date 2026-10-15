// 提升管理员
// 用法: node scripts/promote-admin.mjs --student <学号>
import { db } from '../src/db/index.js';

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : null;
}

const studentId = arg('student');
if (!studentId) {
  console.error('用法: node scripts/promote-admin.mjs --student <学号>');
  process.exit(1);
}

const info = db.prepare("UPDATE users SET role = 'admin' WHERE student_id = ?").run(studentId);
if (info.changes === 0) {
  console.error(`未找到学号 ${studentId}（请先在网页上注册）`);
  process.exit(1);
}
console.log(`✔ ${studentId} 已提升为管理员（网页刷新后生效）`);
