import { ref } from 'vue';
import { request } from '../api/index.js';

// 模块级状态（全局单例，足够本项目使用）
export const user = ref(null);
export const authReady = ref(false);

// 应用启动时恢复会话
export async function fetchMe() {
  try {
    user.value = await request('/api/auth/me');
  } catch {
    user.value = null;
  }
  authReady.value = true;
}

export async function login(studentId, password) {
  const data = await request('/api/auth/login', { method: 'POST', body: { studentId, password } });
  user.value = data.user;
}

export async function register(payload) {
  const data = await request('/api/auth/register', { method: 'POST', body: payload });
  user.value = data.user;
}

export async function logout() {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } finally {
    user.value = null;
  }
}
