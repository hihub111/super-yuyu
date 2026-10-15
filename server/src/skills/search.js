import { z } from 'zod';
import { retrieve } from '../rag/store.js';

// 检索技能：纯函数无 LLM，agent 与 MCP 客户端都可直接调用
export const searchCourseLibrary = {
  name: 'search_course_library',
  description:
    '检索团队课程库（历史教案、逐字稿、安全预案等语料）。生成教案或逐字稿之前，应先调用本工具获取同类课程的参考语料。',
  params: z.object({
    query: z.string().describe('检索关键词，例如「科学课的安全预案写法」「混龄分层提问的例子」'),
    courseType: z.enum(['科学', '手工', '安全', '文化', '环保', '心理']).optional()
      .describe('课程类型过滤，不传则检索全部'),
    section: z.string().optional()
      .describe('板块过滤：教学目标/教学重点/教学难点/教学准备/学习者特征分析/教材内容分析/教学过程/板书设计/安全预案/教学反思/逐字稿'),
    topK: z.number().int().min(1).max(10).optional(),
  }),
  async run(args) {
    const results = await retrieve(args.query, {
      courseType: args.courseType,
      section: args.section,
      topK: args.topK ?? 5,
    });
    return {
      ok: true,
      payload: {
        chunks: results.map((r) => ({
          source: r.source,
          courseType: r.courseType,
          section: r.section,
          pageNo: r.pageNo,
          score: Math.round(r.score * 100) / 100,
          content: r.content,
        })),
      },
    };
  },
};
