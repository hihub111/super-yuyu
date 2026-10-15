import { z } from 'zod';
import { complete } from '../agent/llm.js';
import { IDENTITY, MIXED_AGE_RULES } from '../agent/prompts.js';
import { safeParseJson, formatReferences } from './util.js';

const referenceSchema = z.object({
  source: z.string().optional(),
  section: z.string().optional(),
  content: z.string(),
});

const SAFETY_SECTIONS = ['人员分工', '课前准备', '课堂管控', '突发应急', '课后收尾'];

export const generateSafetyPlan = {
  name: 'generate_safety_plan',
  description:
    '生成课程安全预案 JSON，五块必填：人员分工（主讲/助教/带队老师职责）、课前准备（材料检查/急救用品/场地）、课堂管控（工具使用规则/秩序管理）、突发应急（误食/划伤/摔倒/争抢的处置流程）、课后收尾（清点回收/清理）。安全是支教红线。',
  params: z.object({
    title: z.string(),
    plan: z.string().describe('教案的 JSON 压缩文本'),
    courseType: z.string(),
    classSize: z.number().int().optional(),
    venue: z.string().optional(),
    references: z.array(referenceSchema).optional(),
  }),
  async run(args, ctx) {
    const system = `${IDENTITY}\n\n【安全预案要求】支教安全是红线，五块必填且必须具体可执行（对应到人、对应到动作）。结合课程类型（${args.courseType}）预判风险：动手课关注工具与零件，户外课关注场地与天气，实验课关注误食与化学品。输出 JSON 对象（不要输出 JSON 之外的任何文字）：{"人员分工":"","课前准备":"","课堂管控":"","突发应急":"","课后收尾":""}`;
    const user = [
      `请为课程「${args.title}」生成安全预案。`,
      args.classSize ? `学生人数：${args.classSize}` : '',
      args.venue ? `场地：${args.venue}` : '',
      `\n课程教案：\n${args.plan}`,
      args.references?.length ? `\n参考同类课程安全预案：\n${formatReferences(args.references)}` : '',
    ].filter(Boolean).join('\n');

    let content = '';
    try {
      content = await complete({
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.35,
        json: true,
        signal: ctx?.signal,
      });
    } catch (e) {
      return { ok: false, error: `安全预案生成失败: ${e.message}` };
    }

    const data = safeParseJson(content);
    if (!data) return { ok: false, error: '模型输出不是合法 JSON' };
    const filled = SAFETY_SECTIONS.filter((k) => String(data[k] || '').trim()).length;
    if (filled < 5) return { ok: false, error: `安全预案五块不全（只有 ${filled} 块有内容）` };
    const payload = {};
    for (const k of SAFETY_SECTIONS) payload[k] = String(data[k] || '').trim();
    return { ok: true, payload };
  },
};
