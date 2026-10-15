import { z } from 'zod';
import { skillRegistry } from '../skills/index.js';

// 每个分步允许调用的技能（菜谱约束）
const STEP_TOOLS = {
  plan: ['search_course_library', 'generate_lesson_plan'],
  script: ['search_course_library', 'generate_verbatim_script'],
  materials: ['search_course_library', 'generate_materials_list'],
  safety: ['search_course_library', 'generate_safety_plan'],
  chat: ['search_course_library'],
};

// 生成类技能名（其结果会作为最终产物）
export const GENERATE_SKILLS = new Set([
  'generate_lesson_plan',
  'generate_verbatim_script',
  'generate_materials_list',
  'generate_safety_plan',
]);

// zod → OpenAI 工具定义（zod v4 内置 toJSONSchema，单一 schema 三用：校验/OpenAI/MCP）
export function toolDefsForStep(step) {
  return (STEP_TOOLS[step] || []).map((name) => {
    const skill = skillRegistry[name];
    const schema = z.toJSONSchema(skill.params);
    delete schema.$schema;
    return {
      type: 'function',
      function: {
        name,
        description: skill.description,
        parameters: schema,
      },
    };
  });
}
