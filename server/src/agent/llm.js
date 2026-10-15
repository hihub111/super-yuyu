import OpenAI from 'openai';
import { config } from '../config.js';

// 统一的 DeepSeek 客户端（openai 兼容协议）
export const llm = new OpenAI({
  apiKey: config.deepseekApiKey,
  baseURL: config.deepseekBaseUrl,
});

// 非流式补全（json 模式可选；注意 DeepSeek 要求提示词中出现 "json" 字样）
export async function complete({ messages, temperature = 0.35, json = false, maxTokens = 8000, signal }) {
  const resp = await llm.chat.completions.create(
    {
      model: config.model,
      messages,
      temperature,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
      stream: false,
      max_tokens: maxTokens,
    },
    { signal }
  );
  return resp.choices[0].message.content || '';
}

// 流式补全（逐字稿长文本用，边生成边推送）
export async function streamComplete({ messages, temperature = 0.8, maxTokens = 8000, signal, onDelta }) {
  const resp = await llm.chat.completions.create(
    {
      model: config.model,
      messages,
      temperature,
      stream: true,
      max_tokens: maxTokens,
    },
    { signal }
  );
  let full = '';
  for await (const chunk of resp) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      full += delta;
      onDelta?.(delta);
    }
  }
  return full;
}
