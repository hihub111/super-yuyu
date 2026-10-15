import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../auth.js';
import { runAgent } from '../agent/loop.js';
import { runSkill } from '../skills/index.js';
import { retrieve } from '../rag/store.js';
import { streamComplete } from '../agent/llm.js';
import { buildSystemPrompt } from '../agent/prompts.js';

export const generateRouter = Router();
generateRouter.use(requireAuth);

const STEPS = ['plan', 'script', 'materials', 'safety', 'chat'];
const SKILL_BY_STEP = {
  plan: 'generate_lesson_plan',
  script: 'generate_verbatim_script',
  materials: 'generate_materials_list',
  safety: 'generate_safety_plan',
};
const SAVE_FIELD = {
  plan: 'plan_json',
  script: 'script_md',
  materials: 'materials_json',
  safety: 'safety_json',
};

// 检索兜底：未配置 embedding key 时返回空（生成不因 RAG 未就绪而中断）
async function safeRetrieve(query, opts) {
  try {
    return await retrieve(query, opts);
  } catch (e) {
    console.warn('检索不可用（未配置 SILICONFLOW_API_KEY？）:', e.message);
    return [];
  }
}

function refsFromChunks(chunks) {
  return chunks.map((c) => ({
    source: c.source,
    section: c.section,
    pageNo: c.pageNo ?? null,
    content: c.content,
  }));
}

// 基础技能参数（由课程信息拼装）
function baseArgs(course) {
  const meta = safeJson(course.meta);
  return {
    title: course.title,
    courseType: course.course_type,
    gradeRange: course.grade_range,
    classSize: Number(meta.人数) || undefined,
    durationMin: Number(meta.课时) || undefined,
    materialsAvailable: meta.可用物资,
    venue: meta.场地,
    plan: course.plan_json,
  };
}

// plan B 兜底管线：跳过 agent 编排，直接 检索 → 生成（防 DeepSeek 函数调用抽风）
async function fallbackPipeline(step, course, ctx, sourceText) {
  ctx.emit({ type: 'status', stage: 'retrieving', message: '正在检索课程库…' });
  const refs = await safeRetrieve(`${course.course_type}课程 ${course.title}`, {
    courseType: course.course_type,
    topK: 6,
  });
  ctx.emit({ type: 'status', stage: 'generating', message: '正在生成…' });
  const args = { ...baseArgs(course), references: refsFromChunks(refs) };
  if (sourceText) args.sourceText = sourceText;
  return runSkill(SKILL_BY_STEP[step], args, ctx);
}

// 生成单端点：POST /api/generate {courseId, step, feedback?, sourceText?}（SSE）
generateRouter.post('/', async (req, res) => {
  const { courseId, step, feedback, prompt, sourceText } = req.body || {};
  if (!STEPS.includes(step)) return res.status(400).json({ error: '非法的生成步骤' });
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
  if (!course) return res.status(404).json({ error: '课程不存在' });
  if (course.owner_id !== req.user.id) return res.status(403).json({ error: '只能操作自己的课程' });
  // 强制分步：逐字稿必须在教案确认之后
  if (step === 'script' && course.status !== 'plan_confirmed' && course.status !== 'done') {
    return res.status(400).json({ error: '请先完成并确认教案骨架，再生成逐字稿' });
  }

  // SSE 头
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const emit = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);
  // 长生成防断连：15s 心跳注释行
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 15000);
  const controller = new AbortController();
  // 注意：req.on('close') 在请求体读完时就触发（Node 语义），必须监听 res 的 close
  // 且仅在响应未正常结束时才视为客户端断开
  const onClose = () => {
    if (!res.writableEnded) controller.abort();
  };
  res.on('close', onClose);

  const ctx = { emit, signal: controller.signal };
  const finish = () => {
    clearInterval(heartbeat);
    res.off('close', onClose);
    res.write('data: [DONE]\n\n');
    res.end();
  };

  try {
    if (step === 'chat') {
      // 自由问答：检索注入上下文 + 流式回答
      emit({ type: 'status', stage: 'retrieving', message: '正在检索课程库…' });
      const refs = await safeRetrieve(`${course.course_type}课程 ${course.title} ${prompt || ''}`, {
        courseType: course.course_type,
        topK: 4,
      });
      const context = refs.map((r) => `【语料｜${r.section}】\n${r.content}`).join('\n\n');
      emit({ type: 'status', stage: 'generating', message: 'yuyu正在思考…' });
      await streamComplete({
        messages: [
          { role: 'system', content: `${buildSystemPrompt('chat', course)}\n\n【课程信息】\n课程名：${course.title}\n类型：${course.course_type}\n年级：${course.grade_range}\n当前教案：${course.plan_json}\n\n【可参考的课程库语料】\n${context}` },
          { role: 'user', content: prompt || '你好' },
        ],
        temperature: 0.7,
        signal: controller.signal,
        onDelta: (d) => emit({ type: 'content', content: d }),
      });
      finish();
      return;
    }

    // 分步生成：agent 循环 → 失败走兜底管线
    let payload;
    let usedFallback = false;
    try {
      emit({ type: 'status', stage: 'thinking', message: 'yuyu正在规划生成步骤…' });
      const result = await runAgent({ step, course, feedback, sourceText, ctx });
      payload = result.lastSkillResult?.payload;
      if (!payload) throw new Error('模型未产出结构化结果');
    } catch (e) {
      console.warn(`agent 循环失败（${step}），走兜底管线:`, e.message);
      emit({ type: 'status', stage: 'fallback', message: '切换备用生成管线…' });
      const fallback = await fallbackPipeline(step, course, ctx, sourceText);
      if (!fallback.ok) throw new Error(fallback.error);
      payload = fallback.payload;
      usedFallback = true;
    }

    // 落库
    const value = step === 'script' ? payload.markdown : JSON.stringify(payload);
    db.prepare(`UPDATE courses SET ${SAVE_FIELD[step]} = ?, updated_at = datetime('now') WHERE id = ?`).run(value, course.id);

    emit({ type: 'result', step, payload, usedFallback });
    finish();
  } catch (e) {
    emit({ type: 'error', message: e.message || '生成失败', retryable: true });
    finish();
  }
});

function safeJson(text) {
  try {
    return JSON.parse(text || '{}');
  } catch {
    return {};
  }
}
