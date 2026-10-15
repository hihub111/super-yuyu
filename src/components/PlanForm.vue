<template>
  <div class="space-y-4 max-w-2xl mx-auto pb-4">
    <!-- 基本信息 -->
    <section class="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-sm space-y-3">
      <h2 class="font-bold text-sm text-[#7A907E]">基本信息</h2>
      <div class="grid grid-cols-2 gap-3">
        <Field label="教学时间"><input v-model="plan.教学时间" placeholder="如 2026年7月19日" class="input" /></Field>
        <Field label="执教者"><input v-model="plan.执教者" placeholder="主讲：___  助教：___" class="input" /></Field>
        <Field label="课目"><input v-model="plan.课目" placeholder="课程名称" class="input" /></Field>
        <Field label="课时安排"><input v-model="plan.课时安排" placeholder="如 2课时（80分钟）" class="input" /></Field>
      </div>
    </section>

    <!-- 目标与重难点 -->
    <section class="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-sm space-y-3">
      <h2 class="font-bold text-sm text-[#7A907E]">教学目标</h2>
      <Field label="知识目标"><textarea v-model="plan.教学目标.知识" rows="2" class="input" /></Field>
      <Field label="能力目标"><textarea v-model="plan.教学目标.能力" rows="2" class="input" /></Field>
      <Field label="情感目标"><textarea v-model="plan.教学目标.情感" rows="2" class="input" /></Field>
      <Field label="教学重点"><textarea v-model="plan.教学重点" rows="2" class="input" /></Field>
      <Field label="教学难点"><textarea v-model="plan.教学难点" rows="2" class="input" /></Field>
    </section>

    <!-- 准备与学情 -->
    <section class="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-sm space-y-3">
      <h2 class="font-bold text-sm text-[#7A907E]">教学准备</h2>
      <Field label="教师准备"><textarea v-model="plan.教学准备.教师" rows="2" class="input" /></Field>
      <Field label="学生准备"><textarea v-model="plan.教学准备.学生" rows="2" class="input" /></Field>
      <Field label="学习者特征分析"><textarea v-model="plan.学习者特征分析" rows="3" class="input" placeholder="年级范围、混龄情况、认知特点…" /></Field>
      <Field label="教材内容分析"><textarea v-model="plan.教材内容分析" rows="3" class="input" placeholder="课程内容与设计思路…" /></Field>
      <Field label="分组与加分规则"><textarea v-model="plan.分组与加分规则" rows="3" class="input" placeholder="每组高低年级搭配；回答问题+2分、纪律好+1分、小组展示+3分，结营兑换奖励…" /></Field>
    </section>

    <!-- 教学过程（逐环节） -->
    <section class="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-sm space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="font-bold text-sm text-[#7A907E]">教学过程（逐环节）</h2>
        <button @click="addStep" class="text-xs px-3 py-1.5 rounded-full bg-[#E8F0E9] text-[#7A907E] font-bold hover:bg-[#DDEBDD] transition-colors">
          + 添加环节
        </button>
      </div>

      <div v-for="(step, i) in plan.教学过程" :key="i" class="border border-[#E8F0E9] rounded-xl p-3 space-y-2">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-[#A2C579]">环节 {{ i + 1 }}</span>
          <button @click="plan.教学过程.splice(i, 1)" class="ml-auto text-[11px] text-red-300 font-medium">删除</button>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <Field label="分钟"><input v-model="step.分钟" placeholder="如 0′-5′" class="input" /></Field>
          <Field label="环节名"><input v-model="step.环节" placeholder="如 情境导入" class="input" /></Field>
          <Field label="PPT页"><input v-model="step.ppt" placeholder="如 Slide 3" class="input" /></Field>
        </div>
        <Field label="教师活动（含主讲话术）"><textarea v-model="step.教师活动" rows="3" class="input" /></Field>
        <Field label="学生活动"><textarea v-model="step.学生活动" rows="2" class="input" /></Field>
        <Field label="设计意图"><textarea v-model="step.设计意图" rows="2" class="input" /></Field>
      </div>
      <p v-if="!plan.教学过程.length" class="text-xs opacity-40 text-center py-3">还没有环节，点击「添加环节」开始编排课堂流程</p>
    </section>

    <!-- 板书 + 安全预案 -->
    <section class="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-sm space-y-3">
      <h2 class="font-bold text-sm text-[#7A907E]">板书设计</h2>
      <textarea v-model="plan.板书设计" rows="3" class="input w-full" />

      <h2 class="font-bold text-sm text-[#FF8A8A] pt-2">安全预案（必填五块）</h2>
      <Field v-for="k in safetySections" :key="k" :label="k">
        <textarea v-model="plan.安全预案[k]" rows="2" class="input" />
      </Field>
    </section>

    <!-- 教学反思 -->
    <section class="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-sm space-y-3">
      <h2 class="font-bold text-sm text-[#7A907E]">教学反思</h2>
      <textarea v-model="plan.教学反思" rows="3" class="input w-full" placeholder="上完课后再来填写…" />
    </section>
  </div>
</template>

<script setup>
import { ref, watch, defineComponent, h } from 'vue';
import { normalizePlan, defaultStep, SAFETY_SECTIONS } from '../schema.js';

const props = defineProps({
  plan: { type: Object, default: () => ({}) },
});

const plan = ref(normalizePlan(props.plan));
const safetySections = SAFETY_SECTIONS;

// 外部更新（Phase 3 生成结果注入）时刷新表单
watch(() => props.plan, (raw) => {
  plan.value = normalizePlan(raw);
}, { deep: true });

function addStep() {
  plan.value.教学过程.push(defaultStep());
}

// 供父组件取当前表单内容
function getPlan() {
  return JSON.parse(JSON.stringify(plan.value));
}
defineExpose({ getPlan });

// 简易带标签字段包装（本地小组件，避免重复模板）
const Field = defineComponent({
  props: { label: String },
  setup(props, { slots }) {
    return () => h('div', [
      h('label', { class: 'text-xs font-bold text-gray-400 block mb-1' }, props.label),
      slots.default?.(),
    ]);
  },
});
</script>

<style scoped>
.input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background: #F8FAF9;
  outline: none;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  transition: all 0.2s;
}
.input:focus {
  --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width,) var(--tw-ring-offset-color,);
  box-shadow: 0 0 0 2px rgba(162, 197, 121, 0.5);
}
</style>
