import { db } from '../db/index.js';
import { config } from '../config.js';
import { embedTexts } from './embed.js';

function vecToBlob(v) {
  return Buffer.from(v.buffer, v.byteOffset, v.byteLength);
}
function blobToVec(buf) {
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

// 写入一批 chunk（同一课程包）：逐条嵌入后入库
export async function saveChunks(packageId, courseType, chunks) {
  const insert = db.prepare(
    'INSERT INTO chunks (package_id, course_type, section, page_no, content, embedding) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const embeddings = await embedTexts(chunks.map((c) => c.content));
  const tx = db.transaction(() => {
    for (let i = 0; i < chunks.length; i++) {
      insert.run(
        packageId, courseType, chunks[i].section,
        chunks[i].pageNo ?? null, chunks[i].content, vecToBlob(embeddings[i])
      );
    }
  });
  tx();
  return chunks.length;
}

export function clearPackage(packageId) {
  db.prepare('DELETE FROM chunks WHERE package_id = ?').run(packageId);
}

// 检索：类型/板块硬过滤 → 全量点积（向量已归一化）→ top-k + 相似度阈值
export async function retrieve(query, { courseType, section, topK = 5, threshold } = {}) {
  // 真实嵌入（BGE-M3）相关性通常在 0.3+；伪向量分数偏低，测试时不过滤只排序
  const effThreshold = threshold ?? (config.embedProvider === 'pseudo' ? -1 : 0.3);
  const [qvec] = await embedTexts([query]);
  let rows;
  if (courseType && section) {
    rows = db.prepare('SELECT * FROM chunks WHERE course_type = ? AND section = ?').all(courseType, section);
  } else if (courseType) {
    rows = db.prepare('SELECT * FROM chunks WHERE course_type = ?').all(courseType);
  } else if (section) {
    rows = db.prepare('SELECT * FROM chunks WHERE section = ?').all(section);
  } else {
    rows = db.prepare('SELECT * FROM chunks').all();
  }
  const scored = [];
  for (const r of rows) {
    const v = blobToVec(r.embedding);
    let dot = 0;
    for (let i = 0; i < v.length; i++) dot += v[i] * qvec[i];
    scored.push({
      courseType: r.course_type, section: r.section, pageNo: r.page_no,
      source: r.package_id, content: r.content, score: dot,
    });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .filter((s) => s.score >= effThreshold)
    .slice(0, topK);
}
