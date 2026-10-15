<template>
  <div class="space-y-4 max-w-2xl mx-auto pb-4">
    <section class="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-sm space-y-3">
      <div class="flex items-center gap-2">
        <h2 class="font-bold text-sm text-[#FF8A8A]">安全预案（支教红线，五块必填）</h2>
      </div>
      <div v-for="k in sections" :key="k" class="space-y-1">
        <label class="text-xs font-bold text-gray-400">{{ k }}</label>
        <textarea v-model="draft[k]" rows="3" class="input w-full" :placeholder="placeholders[k]" />
      </div>
    </section>
    <p class="text-[11px] opacity-40 px-2">安全预案是每节课的硬性要求。五块齐全才能通过检查。</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { SAFETY_SECTIONS } from '../schema.js';

const props = defineProps({
  value: { type: Object, default: null }, // {人员分工,课前准备,课堂管控,突发应急,课后收尾}
});

const sections = SAFETY_SECTIONS;
const placeholders = {
  人员分工: '主讲/助教/带队老师各自的职责…',
  课前准备: '材料检查、急救用品、场地清理…',
  课堂管控: '工具使用规则、秩序管理…',
  突发应急: '误食/划伤/摔倒/争抢的处置流程…',
  课后收尾: '清点回收、清理场地、安全提醒…',
};

const draft = ref(normalize(props.value));
watch(() => props.value, (v) => { draft.value = normalize(v); }, { deep: true });

function normalize(v) {
  const out = {};
  for (const k of sections) out[k] = v?.[k] || '';
  return out;
}

function getValue() {
  return JSON.parse(JSON.stringify(draft.value));
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
.input:focus { box-shadow: 0 0 0 2px rgba(255, 138, 138, 0.4); }
</style>
