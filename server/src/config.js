import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.resolve(__dirname, '..');
// quiet: true 防止 dotenv 的提示语打进 stdout（会破坏 MCP 的 stdio 协议）
dotenv.config({ path: path.join(SERVER_ROOT, '.env'), quiet: true });

export const config = {
  serverRoot: SERVER_ROOT,
  port: 3000,

  // DeepSeek（生成模型）
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  deepseekBaseUrl: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',

  // SiliconFlow（中文 embedding）
  siliconflowApiKey: process.env.SILICONFLOW_API_KEY || '',
  siliconflowBaseUrl: 'https://api.siliconflow.cn/v1',
  embeddingModel: 'BAAI/bge-m3',
  embedDim: 1024,
  // 'siliconflow' 真实嵌入；'pseudo' 哈希伪向量（无 key 离线测试检索链路）
  embedProvider: process.env.EMBED_PROVIDER || 'siliconflow',

  // 注册邀请码（团队内部使用）
  inviteCode: process.env.TEAM_INVITE_CODE || '',

  // 路径
  dbPath: process.env.DB_PATH || path.join(SERVER_ROOT, 'data', 'yuyu.db'),
  promptsDir: path.join(SERVER_ROOT, 'prompts'),
  corpusDir: process.env.CORPUS_DIR || path.join(SERVER_ROOT, 'corpus'),

  sessionTtlDays: 30,
};
