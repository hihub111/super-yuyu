<template>
  <div class="flex-1 flex items-center justify-center p-4 overflow-y-auto">
    <div class="w-full max-w-sm">
      <!-- 品牌区 -->
      <div class="flex flex-col items-center mb-6">
        <div class="yuyu-mask w-20 h-20 border-4 border-white shadow-xl bg-[#E8F0E9] overflow-hidden">
          <img src="../assets/yuyu-hand.png" class="w-full h-full object-cover" alt="yuyu" />
        </div>
        <h1 class="mt-3 text-xl font-bold text-[#4A5D4E]">yuyu</h1>
        <p class="text-sm opacity-60">支教课程设计助手</p>
      </div>

      <!-- 表单卡片 -->
      <div class="bg-white/90 backdrop-blur-md rounded-[24px] shadow-xl p-6 leaf-紋理-bg relative overflow-hidden">
        <div class="flex rounded-xl bg-[#F1F6F2] p-1 mb-5">
          <button
            v-for="m in ['login', 'register']" :key="m"
            @click="mode = m"
            :class="['flex-1 py-2 rounded-lg text-sm font-bold transition-all',
                     mode === m ? 'bg-white shadow text-[#4A5D4E]' : 'text-gray-400']"
          >
            {{ m === 'login' ? '登录' : '注册' }}
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="text-xs font-bold text-gray-400">学号</label>
            <input v-model="form.studentId" placeholder="例如 2026001234"
              class="mt-1 w-full px-4 py-3 rounded-xl bg-[#F8FAF9] outline-none text-[15px] focus:ring-2 ring-[#A2C579]/50 transition-all" />
          </div>
          <div v-if="mode === 'register'">
            <label class="text-xs font-bold text-gray-400">姓名</label>
            <input v-model="form.displayName" placeholder="你的姓名"
              class="mt-1 w-full px-4 py-3 rounded-xl bg-[#F8FAF9] outline-none text-[15px] focus:ring-2 ring-[#A2C579]/50 transition-all" />
          </div>
          <div>
            <label class="text-xs font-bold text-gray-400">密码</label>
            <input v-model="form.password" type="password" placeholder="至少 6 位"
              class="mt-1 w-full px-4 py-3 rounded-xl bg-[#F8FAF9] outline-none text-[15px] focus:ring-2 ring-[#A2C579]/50 transition-all" />
          </div>
          <div v-if="mode === 'register'">
            <label class="text-xs font-bold text-gray-400">团队邀请码</label>
            <input v-model="form.inviteCode" placeholder="找队长要"
              class="mt-1 w-full px-4 py-3 rounded-xl bg-[#F8FAF9] outline-none text-[15px] focus:ring-2 ring-[#A2C579]/50 transition-all" />
          </div>

          <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

          <button
            @click="submit"
            :disabled="busy"
            class="w-full py-3 bg-[#7A907E] disabled:bg-gray-300 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all"
          >
            {{ busy ? '请稍候…' : (mode === 'login' ? '登录' : '注册并登录') }}
          </button>
        </div>
      </div>

      <p class="mt-4 text-center text-xs opacity-50">琼台师范学院 · 语绘童心志愿服务团</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { login, register } from '../composables/useAuth.js';

const router = useRouter();
const mode = ref('login');
const form = ref({ studentId: '', password: '', displayName: '', inviteCode: '' });
const error = ref('');
const busy = ref(false);

async function submit() {
  error.value = '';
  busy.value = true;
  try {
    if (mode.value === 'login') {
      await login(form.value.studentId.trim(), form.value.password);
    } else {
      await register({
        studentId: form.value.studentId.trim(),
        password: form.value.password,
        displayName: form.value.displayName.trim(),
        inviteCode: form.value.inviteCode.trim(),
      });
    }
    router.push('/courses');
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>
