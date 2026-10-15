import mammoth from 'mammoth';
import fs from 'node:fs/promises';

// 模板板块名表（按顺序模糊匹配，第一个命中即归属）
const SECTION_KEYS = [
  ['教学目标', '教学目标'], ['教学重点', '教学重点'], ['教学难点', '教学难点'],
  ['教学准备', '教学准备'], ['学习者特征', '学习者特征分析'], ['教材内容', '教材内容分析'],
  ['教学过程', '教学过程'], ['板书设计', '板书设计'], ['安全预案', '安全预案'], ['教学反思', '教学反思'],
];

function matchSection(heading) {
  for (const [keyword, section] of SECTION_KEYS) {
    if (heading.includes(keyword)) return section;
  }
  return '其他';
}

function stripHtml(s) {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// 路径一：HTML 按标题（h1-h3）切板块
function splitByHeadings(html) {
  const re = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const matches = [...html.matchAll(re)];
  const chunks = [];
  let cursor = 0;
  let current = null;
  for (const m of matches) {
    const body = stripHtml(html.slice(cursor, m.index));
    if (current) current.content += (current.content && body ? ' ' : '') + body;
    else if (body) chunks.push({ section: '其他', content: body });
    current = { section: matchSection(stripHtml(m[2])), content: '' };
    chunks.push(current);
    cursor = m.index + m[0].length;
  }
  const tail = stripHtml(html.slice(cursor));
  if (current) current.content += (current.content && tail ? ' ' : '') + tail;
  else if (tail) chunks.push({ section: '其他', content: tail });
  return chunks.filter((c) => c.content);
}

// 路径二（兜底）：纯文本按板块名行切分（防作者用加粗而非标题样式）
// 注意：1) 长词必须排在短词前面（板书设计 在 板书 前） 2) 必须锚定行首，
// 否则正文里出现「临时板书」「教学目标不明确」等词会被误判为板块标签
const LINE_RE = /^\s*(教学目标|教学重点|教学难点|教学准备|教学过程|教学反思|学习者特征分析|学习者特征|教材内容分析|教材内容|板书设计|板书|安全预案)/;

function splitByTextLines(text) {
  const chunks = [];
  let cur = null;
  for (const line of text.split('\n')) {
    const m = line.match(LINE_RE);
    if (m) {
      cur = { section: matchSection(m[1]), content: line.trim() };
      chunks.push(cur);
    } else if (cur) {
      cur.content += '\n' + line;
    } else if (line.trim()) {
      chunks.push({ section: '其他', content: line.trim() });
    }
  }
  return chunks.filter((c) => c.content.trim());
}

// 教学过程细分：按环节行切分（如「三、认识海南的风车（5min）」「（五）课堂小结（3分钟）」）
const STEP_RE = /^[（(]?[一二三四五六七八九十]+[、.．)）]/;

function splitSteps(content) {
  const steps = [];
  let cur = null;
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (STEP_RE.test(t) && /[（(]\d|min|分钟|′/.test(t)) {
      cur = { content: t };
      steps.push(cur);
    } else if (cur) {
      cur.content += '\n' + line;
    }
  }
  if (steps.length >= 2) {
    return steps.map((s) => ({ section: '教学过程', content: s.content.trim() }));
  }
  return chunkByLength(content, 600, 100).map((c) => ({ section: '教学过程', content: c }));
}

// 定长切块（重叠），兜底超大板块
export function chunkByLength(text, size = 600, overlap = 100) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= size) return [clean];
  const out = [];
  let i = 0;
  while (i < clean.length) {
    out.push(clean.slice(i, i + size));
    i += size - overlap;
  }
  return out;
}

// 解析 docx → [{section, content}]，教学过程板块再按环节细分
export async function parseDocx(filePath) {
  const buffer = await fs.readFile(filePath);

  let chunks = null;
  try {
    const { value: html } = await mammoth.convertToHtml({ buffer });
    chunks = splitByHeadings(html);
    if (!chunks.some((c) => c.section !== '其他')) chunks = null;
  } catch (e) {
    chunks = null;
  }

  if (!chunks) {
    const { value: text } = await mammoth.extractRawText({ buffer });
    chunks = splitByTextLines(text);
  }

  return postProcess(chunks);
}

// 后处理：加粗标题漏检修复 + 环节细分 + 超长保护 + 噪音过滤
function postProcess(chunks) {
  const out = [];
  for (const c of chunks) {
    if (c.section === '其他' && LINE_RE.test(c.content)) {
      // 「其他」块内可能藏着加粗风格的板块标题（如板书设计），按行重切
      out.push(...splitByTextLines(c.content));
    } else if (c.section === '教学过程') {
      out.push(...splitSteps(c.content));
    } else {
      out.push(c);
    }
  }
  const flat = [];
  for (const c of out) {
    if (c.content.trim().length < 10) continue; // 丢弃「课目」「课时安排」这类纯标签噪音
    if (c.content.length > 1200) {
      flat.push(...chunkByLength(c.content, 1000, 100).map((x) => ({ ...c, content: x })));
    } else {
      flat.push(c);
    }
  }
  return flat.filter((c) => c.content.trim());
}
