<template>
  <div class="flex flex-col h-full bg-white/80 backdrop-blur-sm">
    <!-- 面板头 -->
    <div class="px-4 py-3 border-b border-gray-100 flex items-center gap-2 shrink-0">
      <img src="../assets/yuyu-hand.png" class="w-7 h-7 rounded-full object-cover" alt="yuyu" />
      <span class="font-bold text-sm flex-1">yuyu助手</span>
      <button v-if="generating" @click="onStop"
        class="text-xs px-3 py-1.5 rounded-full bg-red-100 text-red-500 font-bold hover:bg-red-200 transition-colors">
        ■ 停止
      </button>
    </div>

    <!-- 内容流 -->
    <div ref="scrollBox" class="flex-1 overflow-y-auto p-3 space-y-2">
      <!-- 生成过程事件 -->
      <template v-for="(e, i) in events" :key="'e' + i">
        <div v-if="e.type === 'status'" class="flex items-center gap-2 py-1 px-2">
          <span class="w-1.5 h-1.5 rounded-full bg-[#A2C579] animate-pulse shrink-0"></span>
          <span class="text-xs opacity-60">{{ e.message }}</span>
        </div>
        <div v-else-if="e.type === 'tool'" class="bg-[#F1F6F2] rounded-xl px-3 py-2">
          <p class="text-[11px] font-bold text-[#7A907E]">🔧 调用技能：{{ toolLabel(e.name) }}</p>
          <p class="text-[11px] opacity-60 mt-0.5 line-clamp-2">{{ toolArgs(e) }}</p>
        </div>
        <div v-else-if="e.type === 'error'" class="bg-red-50 rounded-xl px-3 py-2">
          <p class="text-xs text-red-500">{{ e.message }}</p>
        </div>
        <div v-else-if="e.type === 'result'" class="bg-[#E8F0E9] rounded-xl px-3 py-2">
          <p class="text-xs font-bold text-[#7A907E]">✅ {{ stepLabel(e.step) }}已生成，已保存到左侧</p>
        </div>
      </template>

      <!-- 对话消息 -->
      <template v-for="(m, i) in chatMessages" :key="'m' + i">
        <div :class="['flex', m.role === 'user' ? 'justify-end' : 'justify-start']">
          <div :class="['max-w-[90%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed',
                       m.role === 'user' ? 'bg-[#7A907E] text-white rounded-tr-none' : 'bg-white shadow-sm text-[#4A5D4E] rounded-tl-none']">
            <Markdown v-if="m.role === 'assistant'" :content="m.content" />
            <span v-else>{{ m.content }}</span>
          </div>
        </div>
      </template>

      <!-- 空态 -->
      <div v-if="!events.length && !chatMessages.length" class="py-16 text-center">
        <img src="../assets/yuyu-hand.png" class="w-14 h-14 rounded-full object-cover mx-auto opacity-60" alt="yuyu" />
        <p class="mt-3 text-xs opacity-40 leading-relaxed">
          生成过程会在这里展示<br />也可以直接问我问题，比如：<br />「分层提问怎么写？」「这节课有什么安全风险？」
        </p>
      </div>
    </div>

    <!-- 对话输入 -->
    <div class="p-3 border-t border-gray-100 shrink-0">
      <div class="flex items-end gap-2 bg-[#F1F6F2] rounded-2xl p-1.5 pl-3">
        <textarea v-model="chatInput" rows="1" placeholder="问问yuyu…"
          @keydown.enter.exact.prevent="sendChat"
          class="flex-1 max-h-24 py-1.5 outline-none resize-none text-[14px] bg-transparent" />
        <button @click="sendChat" :disabled="chatBusy || !chatInput.trim()"
          class="p-2 bg-[#7A907E] disabled:bg-gray-300 rounded-full text-white shrink-0">
          <Send size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { Send } from 'lucide-vue-next';
import { streamSse } from '../api/index.js';
import Markdown from './Markdown.vue';

const props = defineProps({
  courseId: { type: String, required: true },
  events: { type: Array, default: () => [] },   // 生成过程事件（父组件注入）
  generating: { type: Boolean, default: false },
  onStop: { type: Function, required: false },
});

const scrollBox = ref(null);
const chatMessages = ref([]);
const chatInput = ref('');
const chatBusy = ref(false);
let chatAbort = null;

watch(() => [props.events.length, chatMessages.value.length], () => {
  nextTick(() => { scrollBox.value && (scrollBox.value.scrollTop = scrollBox.value.scrollHeight); });
});

function toolLabel(name) {
  return {
    search_course_library: '检索课程库',
    generate_lesson_plan: '生成教案骨架',
    generate_verbatim_script: '生成逐字稿',
    generate_materials_list: '生成物料清单',
    generate_safety_plan: '生成安全预案',
  }[name] || name;
}

function toolArgs(e) {
  const a = { ...(e.args || {}) };
  if (a.plan) a.plan = `(教案压缩文本 ${a.plan.length} 字)`;
  if (a.references) a.references = `(参考语料 ${a.references.length} 条)`;
  return Object.entries(a).map(([k, v]) => `${k}: ${typeof v === 'string' ? v.slice(0, 40) : JSON.stringify(v)}`).join('  ');
}

function stepLabel(step) {
  return { plan: '教案骨架', script: '逐字稿', materials: '物料清单', safety: '安全预案' }[step] || step;
}

async function sendChat() {
  const text = chatInput.value.trim();
  if (!text || chatBusy.value) return;
  chatInput.value = '';
  chatMessages.value.push({ role: 'user', content: text });
  const aiMsg = { role: 'assistant', content: '' };
  chatMessages.value.push(aiMsg);
  chatBusy.value = true;
  chatAbort = new AbortController();
  try {
    await streamSse('/api/generate', { courseId: props.courseId, step: 'chat', prompt: text }, {
      event: (obj) => {
        if (obj.type === 'content') aiMsg.content += obj.content;
        else if (obj.type === 'error') aiMsg.content += `\n\n⚠ ${obj.message}`;
      },
    }, { signal: chatAbort.signal });
  } catch (e) {
    if (e.name !== 'AbortError') aiMsg.content += `\n\n⚠ ${e.message}`;
  } finally {
    chatBusy.value = false;
  }
}
</script>
