import { z } from 'zod';
import { complete } from '../agent/llm.js';
import { IDENTITY, MIXED_AGE_RULES } from '../agent/prompts.js';
import { safeParseJson, formatReferences } from './util.js';

const referenceSchema = z.object({
  source: z.string().optional(),
  section: z.string().optional(),
  content: z.string(),
});

export const generateMaterialsList = {
  name: 'generate_materials_list',
  description:
    '生成课程物料清单 JSON：{teacher:[{name,qty,note}], student:[{name,qty,note}], notes}。按教师教具和学生材料分列，注明数量与替代品建议（乡村物资有限，优先低成本易得材料）。',
  params: z.object({
    title: z.string(),
    plan: z.string().describe('教案的 JSON 压缩文本'),
    classSize: z.number().int().optional(),
    references: z.array(referenceSchema).optional(),
  }),
  async run(args, ctx) {
    const system = `${IDENTITY}\n\n【物料清单要求】乡村课堂物资有限，优先使用废旧材料和生活常见物品；按小组/按人头注明数量；危险工具（剪刀、小刀、热熔胶）由教师保管并注明；给出缺料时的替代品建议。
输出 JSON 对象（不要输出 JSON 之外的任何文字），字段必须是：
{"teacher":[{"name":"演示用成品","qty":"1套","note":"课前试做"}],"student":[{"name":"牛奶","qty":"每组1盒","note":"可用过期牛奶"}],"notes":"补充说明"}
teacher 是教师教具清单，student 是学生材料清单，notes 是补充注意事项。`;
    const user = [
      `请为课程「${args.title}」生成物料清单。`,
      args.classSize ? `学生人数：${args.classSize}（按小组 5-6 人一组）` : '',
      `\n课程教案：\n${args.plan}`,
      args.references?.length ? `\n参考同类课程物料：\n${formatReferences(args.references)}` : '',
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
      return { ok: false, error: `物料清单生成失败: ${e.message}` };
    }

    const data = safeParseJson(content);
    if (!data) return { ok: false, error: '模型输出不是合法 JSON' };
    const normalized = normalizeMaterials(data);
    if (!normalized) return { ok: false, error: '物料清单缺少 teacher/student 列表' };
    return { ok: true, payload: normalized };
  },
};

// 键名兼容：模型可能输出 teacher/student，也可能输出中文键名
function normalizeMaterials(data) {
  const teacher = data.teacher ?? data.教师 ?? data.教师材料 ?? data.教师准备 ?? data.教具;
  const student = data.student ?? data.学生 ?? data.学生材料 ?? data.学生准备 ?? data.材料;
  if (!Array.isArray(teacher) || !Array.isArray(student)) return null;
  return {
    teacher: teacher.map((i) => ({ name: String(i?.name ?? i?.名称 ?? i?.物品 ?? ''), qty: String(i?.qty ?? i?.数量 ?? ''), note: String(i?.note ?? i?.备注 ?? '') })),
    student: student.map((i) => ({ name: String(i?.name ?? i?.名称 ?? i?.物品 ?? ''), qty: String(i?.qty ?? i?.数量 ?? ''), note: String(i?.note ?? i?.备注 ?? '') })),
    notes: String(data.notes ?? data.备注 ?? data.注意事项 ?? ''),
  };
}
