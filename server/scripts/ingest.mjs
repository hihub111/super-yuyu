// 语料摄取入口
// 用法: node scripts/ingest.mjs --dir corpus/风车 --type 科学 --name 风车 [--force]
import { ingest } from '../src/rag/ingest.js';

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : null;
}

const dir = arg('dir');
const type = arg('type');
const name = arg('name');
if (!dir || !type || !name) {
  console.error('用法: node scripts/ingest.mjs --dir corpus/风车 --type 科学 --name 风车 [--force]');
  process.exit(1);
}

try {
  const count = await ingest({ dir, type, name, force: process.argv.includes('--force') });
  console.log(count ? '✅ 摄取完成' : '— 无新内容');
} catch (e) {
  console.error('❌ 摄取失败:', e.message);
  process.exit(1);
}
