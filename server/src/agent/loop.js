import { config } from '../config.js';
import { llm } from './llm.js';
import { toolDefsForStep, GENERATE_SKILLS } from './tools.js';
import { runSkill } from '../skills/index.js';
import { buildSystemPrompt, buildUserMessage } from './prompts.js';

const MAX_ITERS = 6;

// 手写工具调用循环：DeepSeek 决定调哪个技能，技能内部各自完成 LLM 调用
// 循环层不流式（流式在技能内部做），返回最终产物
export async function runAgent({ step, course, feedback, sourceText, ctx }) {
  const messages = [
    { role: 'system', content: buildSystemPrompt(step, course) },
    { role: 'user', content: buildUserMessage(step, course, feedback, sourceText) },
  ];
  const tools = toolDefsForStep(step);
  let lastSkillResult = null;

  for (let i = 0; i < MAX_ITERS; i++) {
    const resp = await llm.chat.completions.create(
      {
        model: config.model,
        messages,
        tools,
        temperature: 0.3, // 编排层低温度；文风温度由各技能内部控制
        stream: false,
        max_tokens: 4000,
      },
      { signal: ctx?.signal }
    );
    const msg = resp.choices[0].message;
    messages.push(msg);

    if (msg.tool_calls?.length) {
      for (const tc of msg.tool_calls) {
        let args = {};
        try {
          args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
        } catch {
          args = { _raw: tc.function.arguments };
        }
        ctx?.emit?.({ type: 'tool', name: tc.function.name, args });
        const result = await runSkill(tc.function.name, args, ctx);
        if (result.ok && GENERATE_SKILLS.has(tc.function.name)) {
          lastSkillResult = { name: tc.function.name, payload: result.payload };
        }
        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
      }
      continue;
    }

    return { kind: 'text', content: msg.content || '', lastSkillResult };
  }

  throw new Error('工具调用轮次超限');
}
