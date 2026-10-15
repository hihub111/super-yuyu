<template>
  <div class="space-y-4 max-w-2xl mx-auto pb-4">
    <!-- 生成中：实时预览 -->
    <div v-if="generating" class="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-sm">
      <div class="flex items-center gap-2 mb-3">
        <span class="w-2 h-2 rounded-full bg-[#A2C579] animate-pulse"></span>
        <span class="text-xs font-bold text-[#7A907E]">语语正在写逐字稿…</span>
      </div>
      <Markdown :content="liveScript || '…'" />
    </div>

    <!-- 已有逐字稿：预览/编辑切换 -->
    <template v-else-if="value">
      <div class="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-sm text-[#7A907E]">逐字稿</h2>
          <div class="flex gap-2">
            <span v-if="!hasPptMarkers" class="text-[10px] px-2 py-1 rounded-full bg-yellow-100 text-yellow-600 font-bold">
              未检测到 PPT 页标记
            </span>
            <span v-if="!hasTieredQuestions" class="text-[10px] px-2 py-1 rounded-full bg-yellow-100 text-yellow-600 font-bold">
              未检测到分层提问
            </span>
            <button @click="editing = !editing" class="text-xs px-3 py-1.5 rounded-full bg-[#E8F0E9] text-[#7A907E] font-bold">
              {{ editing ? '预览' : '编辑' }}
            </button>
          </div>
        </div>
        <Markdown v-if="!editing" :content="value" />
        <textarea v-else v-model="draft" rows="20" class="input" />
        <p v-if="!editing" class="mt-3 text-[11px] opacity-40">总字数约 {{ charCount }} 字</p>
      </div>
    </template>

    <div v-else class="py-16 text-center text-sm opacity-40">
      还没有逐字稿<br />确认教案后，点上方「生成逐字稿」让语语帮你写
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import Markdown from './Markdown.vue';

const props = defineProps({
  value: { type: String, default: '' },       // 已保存的逐字稿
  liveScript: { type: String, default: '' },  // 生成中的实时内容
  generating: { type: Boolean, default: false },
});

const editing = ref(false);
const draft = ref(props.value);
watch(() => props.value, (v) => { draft.value = v || ''; });

const charCount = computed(() => (props.value || '').length);
const hasPptMarkers = computed(() => /【ppt第\d+页】/i.test(props.value || ''));
const hasTieredQuestions = computed(() => /【低年级】.*【高年级】/s.test(props.value || ''));

function getValue() {
  return editing.value ? draft.value : props.value;
}
defineExpose({ getValue });
</script>

<style scoped>
.input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background: #f8faf9;
  outline: none;
  font-size: 14px;
  line-height: 1.7;
  resize: vertical;
  transition: all 0.2s;
}
.input:focus { box-shadow: 0 0 0 2px rgba(162, 197, 121, 0.5); }
</style>
