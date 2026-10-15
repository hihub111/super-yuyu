import { chunkByLength } from './parseDocx.js';

// 中文数字转整数（支持 1-99：三→3，十→10，十二→12，二十三→23）
const CN = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
function cnNum(s) {
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  if (s === '十') return 10;
  if (s.includes('十')) {
    const [a, b] = s.split('十');
    return (a ? CN[a] : 1) * 10 + (b ? CN[b] : 0);
  }
  return CN[s] ?? null;
}

// 逐字稿按 PPT 页标记切分，兼容多种写法：
// *【ppt第三页】* / *ppt第6页* / **【PPT 第 1 页：课前规矩】** / 【PPT 第 15–18 页】
const PAGE_RE = /ppt\s*第\s*([\d一二三四五六七八九十]+)(?:[–—~-]\s*([\d一二三四五六七八九十]+))?\s*页/gi;

export function parseMd(content) {
  const markers = [...content.matchAll(PAGE_RE)];
  if (markers.length) {
    const chunks = [];
    let cursor = 0;
    let cur = null;
    for (const m of markers) {
      const body = content.slice(cursor, m.index).trim();
      if (cur) cur.content += (cur.content && body ? '\n' : '') + body;
      else if (body) chunks.push({ section: '逐字稿', pageNo: null, content: body });
      const pageNo = cnNum(m[1]);
      cur = { section: '逐字稿', pageNo, content: '' };
      chunks.push(cur);
      cursor = m.index + m[0].length;
    }
    const tail = content.slice(cursor).trim();
    if (cur) cur.content += (cur.content && tail ? '\n' : '') + tail;
    else if (tail) chunks.push({ section: '逐字稿', pageNo: null, content: tail });
    return chunks.filter((c) => c.content).map((c) => {
      if (c.content.length > 1200) {
        return chunkByLength(c.content, 1000, 100).map((x) => ({ section: '逐字稿', pageNo: c.pageNo, content: x }));
      }
      return [c];
    }).flat();
  }

  // 无 PPT 标记：按 ## 标题切
  const h2 = [...content.matchAll(/^## (.+)$/gm)];
  if (h2.length >= 2) {
    const chunks = [];
    let cursor = 0;
    for (let i = 0; i < h2.length; i++) {
      const end = i + 1 < h2.length ? h2[i + 1].index : content.length;
      const body = content.slice(h2[i].index + h2[i][0].length, end).trim();
      if (body) chunks.push({ section: '逐字稿', pageNo: null, content: body });
      cursor = end;
    }
    if (chunks.length) return chunks;
  }

  return chunkByLength(content, 800, 100).map((c) => ({ section: '逐字稿', pageNo: null, content: c }));
}
