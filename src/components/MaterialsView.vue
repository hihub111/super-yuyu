<template>
  <div class="space-y-4 max-w-2xl mx-auto pb-4">
    <section class="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-sm space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="font-bold text-sm text-[#7A907E]">教师教具</h2>
        <button @click="addItem('teacher')" class="text-xs px-3 py-1.5 rounded-full bg-[#E8F0E9] text-[#7A907E] font-bold">+ 添加</button>
      </div>
      <div v-for="(item, i) in draft.teacher" :key="'t' + i" class="flex gap-2 items-start">
        <input v-model="item.name" placeholder="名称" class="input flex-[2]" />
        <input v-model="item.qty" placeholder="数量" class="input w-20" />
        <input v-model="item.note" placeholder="备注" class="input flex-[2]" />
        <button @click="draft.teacher.splice(i, 1)" class="p-2 text-red-300 shrink-0">✕</button>
      </div>
      <p v-if="!draft.teacher.length" class="text-xs opacity-40 text-center py-2">暂无教师教具</p>
    </section>

    <section class="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-sm space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="font-bold text-sm text-[#7A907E]">学生材料</h2>
        <button @click="addItem('student')" class="text-xs px-3 py-1.5 rounded-full bg-[#E8F0E9] text-[#7A907E] font-bold">+ 添加</button>
      </div>
      <div v-for="(item, i) in draft.student" :key="'s' + i" class="flex gap-2 items-start">
        <input v-model="item.name" placeholder="名称" class="input flex-[2]" />
        <input v-model="item.qty" placeholder="数量" class="input w-20" />
        <input v-model="item.note" placeholder="备注" class="input flex-[2]" />
        <button @click="draft.student.splice(i, 1)" class="p-2 text-red-300 shrink-0">✕</button>
      </div>
      <p v-if="!draft.student.length" class="text-xs opacity-40 text-center py-2">暂无学生材料</p>
    </section>

    <section class="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-sm space-y-2">
      <h2 class="font-bold text-sm text-[#7A907E]">补充说明</h2>
      <textarea v-model="draft.notes" rows="3" class="input w-full" placeholder="分组方式、替代品建议、采买注意事项…" />
    </section>

    <div v-if="!draft.teacher.length && !draft.student.length" class="py-8 text-center text-sm opacity-40">
      还没有物料清单，点上方「生成物料清单」让语语帮你列
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  value: { type: Object, default: null }, // {teacher:[], student:[], notes:''}
});

const draft = ref(normalize(props.value));
watch(() => props.value, (v) => { draft.value = normalize(v); }, { deep: true });

function normalize(v) {
  return {
    teacher: Array.isArray(v?.teacher) ? v.teacher.map((i) => ({ ...i })) : [],
    student: Array.isArray(v?.student) ? v.student.map((i) => ({ ...i })) : [],
    notes: v?.notes || '',
  };
}

function addItem(kind) {
  draft.value[kind].push({ name: '', qty: '', note: '' });
}

function getValue() {
  return JSON.parse(JSON.stringify(draft.value));
}
defineExpose({ getValue });
</script>

<style scoped>
.input {
  padding: 0.6rem 0.75rem;
  border-radius: 0.75rem;
  background: #f8faf9;
  outline: none;
  font-size: 14px;
  transition: all 0.2s;
}
.input:focus { box-shadow: 0 0 0 2px rgba(162, 197, 121, 0.5); }
</style>
