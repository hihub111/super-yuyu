// 技能共享工具
export function safeParseJson(text) {
  if (!text) return null;
  // 去掉 ```json 围栏
  let t = text.replace(/```(?:json)?/g, '').trim();
  // 截取第一个 { 到最后一个 }
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  t = t.slice(start, end + 1);
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

// 检索语料 → 注入提示词的文本
export function formatReferences(refs) {
  if (!refs?.length) return '';
  return refs
    .map((r, i) => `【参考${i + 1}｜${r.source || ''}｜${r.section || ''}】\n${r.content}`)
    .join('\n\n');
}
