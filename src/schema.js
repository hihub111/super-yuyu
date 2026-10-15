// 教案 JSON 结构：与服务端 server/prompts/plan-template.md 保持一致（两边互相对应）
// 课程类型
export const COURSE_TYPES = ['科学', '手工', '安全', '文化', '环保', '心理'];

// 安全预案五大板块（硬性要求，每份产出必含）
export const SAFETY_SECTIONS = ['人员分工', '课前准备', '课堂管控', '突发应急', '课后收尾'];

// 课程状态
export const STATUS_LABELS = {
  draft: '草稿',
  plan_confirmed: '教案已确认',
  done: '已完成',
};

export function defaultPlan() {
  return {
    教学时间: '',
    执教者: '',
    课目: '',
    课时安排: '2课时（80分钟）',
    教学目标: { 知识: '', 能力: '', 情感: '' },
    教学重点: '',
    教学难点: '',
    教学准备: { 教师: '', 学生: '' },
    学习者特征分析: '',
    教材内容分析: '',
    分组与加分规则: '',
    教学过程: [], // [{分钟, 环节, ppt, 教师活动, 学生活动, 设计意图}]
    板书设计: '',
    安全预案: { 人员分工: '', 课前准备: '', 课堂管控: '', 突发应急: '', 课后收尾: '' },
    教学反思: '',
  };
}

export function defaultStep() {
  return { 分钟: '', 环节: '', ppt: '', 教师活动: '', 学生活动: '', 设计意图: '' };
}

// 把任意（可能缺字段的）教案对象补齐成完整结构
export function normalizePlan(raw) {
  const base = defaultPlan();
  const src = raw || {};
  for (const key of Object.keys(base)) {
    if (key in src) {
      if (typeof base[key] === 'object' && base[key] !== null && !Array.isArray(base[key])) {
        base[key] = { ...base[key], ...(src[key] || {}) };
      } else {
        base[key] = src[key];
      }
    }
  }
  return base;
}
