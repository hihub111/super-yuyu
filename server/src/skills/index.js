import { searchCourseLibrary } from './search.js';
import { generateLessonPlan } from './lesson-plan.js';
import { generateVerbatimScript } from './script.js';
import { generateMaterialsList } from './materials.js';
import { generateSafetyPlan } from './safety.js';

// 技能注册表：一份代码双通道（内部 agent 循环 + MCP 服务器）
export const skillRegistry = {
  [searchCourseLibrary.name]: searchCourseLibrary,
  [generateLessonPlan.name]: generateLessonPlan,
  [generateVerbatimScript.name]: generateVerbatimScript,
  [generateMaterialsList.name]: generateMaterialsList,
  [generateSafetyPlan.name]: generateSafetyPlan,
};

// 统一执行入口：zod 校验参数 → 运行 → 错误归一化为 {ok:false,error}
export async function runSkill(name, args, ctx) {
  const skill = skillRegistry[name];
  if (!skill) return { ok: false, error: `未知技能: ${name}` };
  try {
    const parsed = skill.params.parse(args);
    return await skill.run(parsed, ctx);
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
