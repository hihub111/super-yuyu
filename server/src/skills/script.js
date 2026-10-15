import { z } from 'zod';
import { streamComplete } from '../agent/llm.js';
import { IDENTITY, MIXED_AGE_RULES, teacherLanguage, fewShot } from '../agent/prompts.js';
import { formatReferences } from './util.js';

const referenceSchema = z.object({
  source: z.string().optional(),
  section: z.string().optional(),
  pageNo: z.number().int().nullable().optional(),
  content: z.string(),
});

const SCRIPT_FORMAT = `【逐字稿格式要求】
1. 输出 markdown，按 PPT 页切分，每页开头标注 *【ppt第N页】*（N 从 1 开始递增），后面跟该页标题。
2. 主讲台词用儿童化口语，动作/语气提示写在括号里（如：（做睡觉手势）（语速加快，情绪调动）（指屏幕））。
3. 每页 80-150 字，全文总量 4000-6000 字，对应 2-3 课时的课。
4. 混龄分层提问：同一知识点设计低年级版和高年级版问题，标注【低年级】【高年级】。
5. 课堂口令（"小嘴巴——不说话"等）写在讲解前、动手前。
6. 加分操作：开场讲清加分规则；加分动作写进台词或舞台指示（如：（转身在黑板上给第二组+2分）），加分要具体到行为。
7. 开头用 yuyu 情境导入（yuyu 是团队吉祥物，森林探险小精灵，可用小故事或小视频引出课题）。
8. 结尾做课堂总结，呼应 yuyu 的冒险。`;

export const generateVerbatimScript = {
  name: 'generate_verbatim_script',
  description:
    '生成完整逐字稿（教师上课台词脚本，markdown 格式，含 PPT 页标记、舞台指示、混龄分层提问）。plan 参数传教案的 JSON 压缩文本；references 传检索到的参考逐字稿。生成过程流式输出。',
  params: z.object({
    title: z.string(),
    plan: z.string().describe('教案的 JSON 压缩文本'),
    references: z.array(referenceSchema).optional(),
    feedback: z.string().optional().describe('重新生成时的修改意见'),
  }),
  async run(args, ctx) {
    const system = `${IDENTITY}\n\n${MIXED_AGE_RULES}\n\n${teacherLanguage()}\n\n${SCRIPT_FORMAT}${
      fewShot('script-example.md') ? `\n\n【团队真实逐字稿范例（模仿其风格）】\n${fewShot('script-example.md')}` : ''
    }`;
    const user = [
      `请为课程「${args.title}」生成完整逐字稿。`,
      `\n课程教案：\n${args.plan}`,
      args.references?.length ? `\n参考逐字稿（模仿语言风格与课堂口令）：\n${formatReferences(args.references)}` : '',
      args.feedback ? `\n修改意见：${args.feedback}` : '',
    ].filter(Boolean).join('\n');

    let markdown = '';
    try {
      markdown = await streamComplete({
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.8, // 逐字稿保留文风温度
        signal: ctx?.signal,
        onDelta: (d) => ctx?.emit?.({ type: 'content', content: d }),
      });
    } catch (e) {
      return { ok: false, error: `逐字稿生成失败: ${e.message}` };
    }

    if (markdown.trim().length < 200) {
      return { ok: false, error: '生成的逐字稿过短，请重试' };
    }
    return { ok: true, payload: { markdown } };
  },
};
