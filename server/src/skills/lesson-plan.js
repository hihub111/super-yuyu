import { z } from 'zod';
import { complete } from '../agent/llm.js';
import { IDENTITY, MIXED_AGE_RULES, teacherLanguage, planTemplate } from '../agent/prompts.js';
import { safeParseJson, formatReferences } from './util.js';

const referenceSchema = z.object({
  source: z.string().optional(),
  section: z.string().optional(),
  pageNo: z.number().int().nullable().optional(),
  content: z.string(),
});

export const generateLessonPlan = {
  name: 'generate_lesson_plan',
  description:
    '生成教案骨架（教学设计）JSON。需要课程名称、类型、年级范围等基本信息；references 参数可携带检索到的参考语料。输出为 JSON 对象，包含教学目标/重难点/教学过程/安全预案等全部板块。',
  params: z.object({
    title: z.string(),
    courseType: z.string(),
    gradeRange: z.string().optional(),
    classSize: z.number().int().optional(),
    durationMin: z.number().int().optional(),
    materialsAvailable: z.string().optional(),
    sourceText: z.string().optional().describe('老师提供的原始材料（策划案/活动方案/课文），需要转换为标准教案格式'),
    references: z.array(referenceSchema).optional(),
  }),
  async run(args, ctx) {
    const system = `${IDENTITY}\n\n${MIXED_AGE_RULES}\n\n${teacherLanguage()}\n\n${planTemplate()}`;
    const user = [
      `请为课程「${args.title}」生成教案骨架，直接输出 JSON（不要输出 JSON 之外的任何文字）。`,
      `课程类型：${args.courseType}`,
      args.gradeRange ? `年级范围：${args.gradeRange}年级（混龄，注意分层设计）` : '',
      args.classSize ? `学生人数：${args.classSize}` : '',
      args.durationMin ? `课程时长：${args.durationMin}分钟` : '',
      args.materialsAvailable ? `可用物资：${args.materialsAvailable}` : '',
      args.sourceText
        ? `\n老师提供的原始材料（可能是不规范的策划案格式，请理解其内容后转换为标准教案结构）：\n${args.sourceText}`
        : '',
      args.references?.length ? `\n参考语料（模仿其结构与语言风格）：\n${formatReferences(args.references)}` : '',
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
      return { ok: false, error: `教案生成失败: ${e.message}` };
    }

    const plan = safeParseJson(content);
    if (!plan) return { ok: false, error: '模型输出不是合法 JSON' };

    const normalized = normalizePlan(plan);
    const missing = validatePlan(normalized);
    if (missing.length) {
      return { ok: false, error: `教案缺少关键内容: ${missing.join('、')}` };
    }
    return { ok: true, payload: normalized };
  },
};

// 服务端教案归一化：补齐缺失字段、兼容模型输出差异
function normalizePlan(raw) {
  const p = raw || {};
  return {
    教学时间: str(p.教学时间),
    执教者: str(p.执教者),
    课目: str(p.课目),
    课时安排: str(p.课时安排) || '2课时（80分钟）',
    教学目标: {
      知识: str(p.教学目标?.知识 ?? (Array.isArray(p.教学目标) ? p.教学目标[0] : '')),
      能力: str(p.教学目标?.能力 ?? (Array.isArray(p.教学目标) ? p.教学目标[1] : '')),
      情感: str(p.教学目标?.情感 ?? (Array.isArray(p.教学目标) ? p.教学目标[2] : '')),
    },
    教学重点: str(p.教学重点 ?? (Array.isArray(p.教学重点) ? p.教学重点.join('；') : '')),
    教学难点: str(p.教学难点 ?? (Array.isArray(p.教学难点) ? p.教学难点.join('；') : '')),
    教学准备: {
      教师: str(p.教学准备?.教师 ?? (Array.isArray(p.教学准备) ? p.教学准备.join('；') : '')),
      学生: str(p.教学准备?.学生 ?? ''),
    },
    学习者特征分析: str(p.学习者特征分析),
    教材内容分析: str(p.教材内容分析),
    教学过程: (Array.isArray(p.教学过程) ? p.教学过程 : []).map((s) => ({
      分钟: str(s?.分钟),
      环节: str(s?.环节),
      ppt: str(s?.ppt),
      教师活动: str(s?.教师活动),
      学生活动: str(s?.学生活动),
      设计意图: str(s?.设计意图),
    })),
    板书设计: str(p.板书设计),
    安全预案: {
      人员分工: str(p.安全预案?.人员分工),
      课前准备: str(p.安全预案?.课前准备),
      课堂管控: str(p.安全预案?.课堂管控),
      突发应急: str(p.安全预案?.突发应急),
      课后收尾: str(p.安全预案?.课后收尾),
    },
    教学反思: str(p.教学反思),
  };
}

function str(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v.trim();
  return String(v).trim();
}

function validatePlan(p) {
  const missing = [];
  if (!p.教学目标.知识 && !p.教学目标.能力 && !p.教学目标.情感) missing.push('教学目标');
  if (!p.教学重点) missing.push('教学重点');
  if (!p.教学过程.length) missing.push('教学过程');
  const safety = Object.values(p.安全预案).filter(Boolean).length;
  if (safety < 3) missing.push('安全预案(至少3块)');
  return missing;
}
