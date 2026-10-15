import { config } from '../config.js';

// 嵌入接口抽象：只导出 embedTexts，换供应商只改本文件
// 返回与输入同序的 Float32Array（已 L2 归一化，检索时可直接点积）
export async function embedTexts(texts) {
  if (!texts.length) return [];
  if (config.embedProvider === 'pseudo') return texts.map(pseudoEmbed);
  return embedViaSiliconflow(texts);
}

async function embedViaSiliconflow(texts) {
  if (!config.siliconflowApiKey) {
    throw new Error('缺少 SILICONFLOW_API_KEY：请注册硅基流动后写入 server/.env（离线测试可设 EMBED_PROVIDER=pseudo）');
  }
  const batchSize = 8; // 8 条/批，远离单次 token 上限
  const out = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    out.push(...(await callWithRetry(batch, 3)));
    console.log(`  embed ${Math.min(i + batchSize, texts.length)}/${texts.length}`);
  }
  return out;
}

async function callWithRetry(batch, retries) {
  try {
    const res = await fetch(`${config.siliconflowBaseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.siliconflowApiKey}`,
      },
      body: JSON.stringify({
        model: config.embeddingModel,
        input: batch,
        encoding_format: 'float',
      }),
    });
    if (!res.ok) throw new Error(`embedding API ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    return data.data.map((d) => normalize(new Float32Array(d.embedding)));
  } catch (e) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 1200));
      return callWithRetry(batch, retries - 1);
    }
    throw e;
  }
}

function normalize(v) {
  let sum = 0;
  for (let i = 0; i < v.length; i++) sum += v[i] * v[i];
  const len = Math.sqrt(sum) || 1;
  for (let i = 0; i < v.length; i++) v[i] /= len;
  return v;
}

// 离线测试用：确定性哈希伪向量（字符+二元组袋），仅当 EMBED_PROVIDER=pseudo
// 相关性弱于真实嵌入，仅用于验证管线链路
function pseudoEmbed(text) {
  const v = new Float32Array(config.embedDim);
  const add = (i, w) => { v[((i % config.embedDim) + config.embedDim) % config.embedDim] += w; };
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    add(code * 31 + i * 7, 1);
    add(code * 17 + i * 3, -0.5);
    if (i + 1 < text.length) {
      const bigram = code * 131 + text.charCodeAt(i + 1);
      add(bigram * 11 + i, 0.25);
    }
  }
  return normalize(v);
}
