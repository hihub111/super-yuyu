<template>
  <div class="flex flex-col h-full">
    <!-- 顶栏 -->
    <header class="bg-white/90 backdrop-blur-md rounded-b-[24px] shadow-sm px-4 py-3 flex items-center gap-3 shrink-0 z-40">
      <button @click="$router.push('/courses')" class="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
        <ChevronLeft size="22" class="text-[#7A907E]" />
      </button>
      <div class="flex-1 min-w-0">
        <h1 class="font-bold text-[15px] truncate">{{ course?.title || '加载中…' }}</h1>
        <p class="text-[11px] opacity-50">{{ course?.courseType }} · {{ course?.gradeRange }}年级 · {{ statusLabel }}</p>
      </div>
      <button @click="showAssistant = true" class="lg:hidden p-2 rounded-full bg-[#F1F6F2] text-[#7A907E]">
        <MessageCircle size="18" />
      </button>
      <button @click="toggleShare" :disabled="busy"
        :class="['shrink-0 text-xs px-3 py-1.5 rounded-full font-bold transition-colors',
                 course?.isShared ? 'bg-[#A2C579]/20 text-[#7A907E]' : 'bg-[#F1F6F2] text-gray-500']">
        {{ course?.isShared ? '已分享' : '分享到团队库' }}
      </button>
    </header>

    <div class="flex-1 flex overflow-hidden">
      <!-- 左侧步骤导航 -->
      <aside class="w-[92px] shrink-0 bg-white/70 backdrop-blur-sm border-r border-white flex flex-col py-4 gap-2 overflow-y-auto">
        <button v-for="(s, i) in steps" :key="i" @click="activeStep = i"
          :class="['flex flex-col items-center gap-1.5 py-3 rounded-xl mx-2 transition-all',
                   activeStep === i ? 'bg-white shadow text-[#7A907E]' : 'text-gray-400']">
          <span class="w-7 h-7 rounded-full bg-[#E8F0E9] flex items-center justify-center text-xs font-bold">{{ i + 1 }}</span>
          <span class="text-[11px] font-medium leading-tight text-center">{{ s.label }}</span>
          <span v-if="s.badge" :class="['text-[9px] px-1.5 py-0.5 rounded-full font-bold', s.badge.color]">{{ s.badge.text }}</span>
        </button>
      </aside>

      <!-- 主区 -->
      <main class="flex-1 overflow-y-auto p-4 flex flex-col">
        <!-- 分步工具栏 -->
        <div class="max-w-2xl mx-auto w-full mb-4 space-y-2 shrink-0">
          <div class="flex gap-2 items-center">
            <button @click="generate(currentStep)" :disabled="generating || !canGenerate"
              class="flex-1 py-2.5 bg-[#7A907E] disabled:bg-gray-300 text-white rounded-xl text-sm font-bold shadow active:scale-95 transition-all">
              {{ generating ? '生成中，可在右侧查看进度…' : genButtonText }}
            </button>
          </div>
          <p v-if="currentStep === 'script' && course?.status === 'draft'" class="text-[11px] text-amber-500">
            请先完成并「确认教案」再生成逐字稿
          </p>
          <button v-if="currentStep === 'plan' && course?.status === 'draft' && !showSource"
            @click="showSource = true"
            class="text-[11px] text-[#7A907E] font-medium underline underline-offset-2">
            ＋ 粘贴原始材料（策划案/活动方案，可让语语转换格式）
          </button>
          <textarea v-if="showSource" v-model="sourceText" rows="5"
            placeholder="粘贴原始策划案或活动方案全文，语语会把它转换为标准教案格式…"
            class="w-full px-4 py-3 rounded-xl bg-white/80 text-[13px] leading-relaxed outline-none focus:ring-2 ring-[#A2C579]/50 resize-y" />
          <input v-if="hasContent" v-model="feedback" placeholder="修改意见（可选），如：导入环节换成魔术开场"
            class="w-full px-4 py-2 rounded-xl bg-white/80 text-[13px] outline-none focus:ring-2 ring-[#A2C579]/50" />
        </div>

        <!-- 步骤视图 -->
        <div class="flex-1">
          <PlanForm v-if="currentStep === 'plan'" ref="planFormRef" :plan="course?.planJson || {}" />
          <ScriptView v-else-if="currentStep === 'script'" ref="scriptViewRef"
            :value="course?.scriptMd || ''" :live-script="liveScript" :generating="generating && currentStep === 'script'" />
          <MaterialsView v-else-if="currentStep === 'materials'" ref="materialsViewRef" :value="course?.materialsJson" />
          <SafetyView v-else ref="safetyViewRef" :value="course?.safetyJson" />
        </div>
      </main>

      <!-- 右侧语语助手（桌面） -->
      <aside class="hidden lg:flex w-[300px] shrink-0 border-l border-white">
        <ChatPanel :course-id="course?.id" :events="events" :generating="generating" :on-stop="stopGenerate" />
      </aside>
    </div>

    <!-- 底部操作栏 -->
    <footer class="bg-white/95 backdrop-blur-xl rounded-t-[24px] shadow-[0_-10px_30px_rgba(0,0,0,0.04)] px-5 py-4 pb-8 shrink-0 z-40 flex items-center gap-3">
      <p class="text-[11px] opacity-50 flex-1 truncate">{{ saveHint }}</p>
      <template v-if="currentStep === 'plan'">
        <button @click="saveCurrentStep(false)" class="px-5 py-3 rounded-xl bg-[#F1F6F2] font-bold text-gray-600 active:scale-95 transition-all">
          保存教案
        </button>
        <button @click="saveCurrentStep(true)" :disabled="busy || course?.status === 'plan_confirmed'"
          class="px-5 py-3 bg-[#7A907E] disabled:bg-gray-300 text-white rounded-xl font-bold shadow active:scale-95 transition-all">
          {{ course?.status === 'plan_confirmed' ? '已确认' : '确认教案' }}
        </button>
      </template>
      <button v-else @click="saveCurrentStep(false)" :disabled="busy"
        class="px-6 py-3 bg-[#7A907E] disabled:bg-gray-300 text-white rounded-xl font-bold shadow active:scale-95 transition-all">
        保存{{ stepLabels[currentStep] }}
      </button>
    </footer>

    <!-- 移动端语语助手（全屏抽屉） -->
    <transition name="fade">
      <div v-if="showAssistant" class="absolute inset-0 z-[70] bg-black/30 flex flex-col lg:hidden">
        <div class="h-full w-full max-w-md ml-auto bg-white shadow-2xl flex flex-col">
          <button @click="showAssistant = false" class="absolute top-4 left-4 z-10 p-2 bg-white rounded-full shadow">
            <X size="18" class="text-gray-500" />
          </button>
          <ChatPanel :course-id="course?.id" :events="events" :generating="generating" :on-stop="stopGenerate" />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ChevronLeft, MessageCircle, X } from 'lucide-vue-next';
import { request, streamSse } from '../api/index.js';
import { STATUS_LABELS } from '../schema.js';
import PlanForm from './PlanForm.vue';
import ScriptView from './ScriptView.vue';
import MaterialsView from './MaterialsView.vue';
import SafetyView from './SafetyView.vue';
import ChatPanel from './ChatPanel.vue';

const route = useRoute();
const course = ref(null);
const activeStep = ref(0);
const busy = ref(false);
const generating = ref(false);
const events = ref([]);
const liveScript = ref('');
const feedback = ref('');
const sourceText = ref('');
const showSource = ref(false);
const showAssistant = ref(false);
const saveHint = ref('');

const planFormRef = ref(null);
const scriptViewRef = ref(null);
const materialsViewRef = ref(null);
const safetyViewRef = ref(null);
let abortController = null;

const stepLabels = { plan: '教案', script: '逐字稿', materials: '物料', safety: '安全预案' };
const currentStep = computed(() => ['plan', 'script', 'materials', 'safety'][activeStep.value]);
const statusLabel = computed(() => STATUS_LABELS[course.value?.status] || '');

const steps = computed(() => [
  { label: '教案骨架', badge: course.value?.status !== 'draft' ? { text: '已确认', color: 'bg-[#A2C579]/20 text-[#7A907E]' } : null },
  { label: '逐字稿', badge: course.value?.scriptMd ? { text: '已生成', color: 'bg-[#A2C579]/20 text-[#7A907E]' } : null },
  { label: '物料清单', badge: course.value?.materialsJson ? { text: '已生成', color: 'bg-[#A2C579]/20 text-[#7A907E]' } : null },
  { label: '安全预案', badge: course.value?.safetyJson ? { text: '已生成', color: 'bg-[#A2C579]/20 text-[#7A907E]' } : null },
]);

const hasContent = computed(() => {
  switch (currentStep.value) {
    case 'plan': return course.value?.status !== 'draft' || Object.keys(course.value?.planJson || {}).length > 2;
    case 'script': return !!course.value?.scriptMd;
    case 'materials': return !!course.value?.materialsJson;
    case 'safety': return !!course.value?.safetyJson;
    default: return false;
  }
});

const canGenerate = computed(() => {
  if (currentStep.value !== 'script') return true;
  return course.value?.status === 'plan_confirmed' || course.value?.status === 'done';
});

const genButtonText = computed(() => {
  if (!canGenerate.value) return '生成逐字稿';
  return hasContent.value ? `重新生成${stepLabels[currentStep.value]}${feedback.value.trim() ? '（按修改意见）' : ''}` : `让语语生成${stepLabels[currentStep.value]}`;
});

onMounted(loadCourse);
async function loadCourse() {
  try {
    course.value = await request(`/api/courses/${route.params.id}`);
  } catch (e) {
    saveHint.value = e.message;
  }
}

async function generate(step) {
  if (generating.value) return;
  generating.value = true;
  events.value = [];
  liveScript.value = '';
  saveHint.value = '';
  abortController = new AbortController();
  const fb = feedback.value.trim() || undefined;
  const src = sourceText.value.trim() || undefined;
  try {
    await streamSse('/api/generate', { courseId: course.value.id, step, feedback: fb, sourceText: src }, {
      event: (obj) => {
        if (obj.type === 'status' || obj.type === 'tool' || obj.type === 'error') {
          events.value.push(obj);
        } else if (obj.type === 'content') {
          liveScript.value += obj.content;
        } else if (obj.type === 'result') {
          events.value.push(obj);
          if (step === 'plan') course.value.planJson = obj.payload;
          else if (step === 'script') course.value.scriptMd = obj.payload.markdown;
          else if (step === 'materials') course.value.materialsJson = obj.payload;
          else if (step === 'safety') course.value.safetyJson = obj.payload;
          saveHint.value = `${stepLabels[step]}已生成并保存 ✓`;
        }
      },
    }, { signal: abortController.signal });
    feedback.value = '';
    if (src) { sourceText.value = ''; showSource.value = false; }
  } catch (e) {
    if (e.name !== 'AbortError') events.value.push({ type: 'error', message: e.message });
  } finally {
    generating.value = false;
    await loadCourse(); // 与服务端最新状态对齐
  }
}

function stopGenerate() {
  abortController?.abort();
  generating.value = false;
}

async function saveCurrentStep(confirmStatus) {
  busy.value = true;
  try {
    const step = currentStep.value;
    let body = {};
    if (step === 'plan') {
      body.planJson = planFormRef.value?.getPlan();
      if (confirmStatus && course.value.status === 'draft') body.status = 'plan_confirmed';
    } else if (step === 'script') {
      body.scriptMd = scriptViewRef.value?.getValue();
    } else if (step === 'materials') {
      body.materialsJson = materialsViewRef.value?.getValue();
    } else {
      body.safetyJson = safetyViewRef.value?.getValue();
    }
    course.value = await request(`/api/courses/${course.value.id}`, { method: 'PUT', body });
    saveHint.value = confirmStatus ? '教案已确认 ✓' : `已保存 ✓`;
    setTimeout(() => (saveHint.value = ''), 2000);
  } catch (e) {
    saveHint.value = e.message;
  } finally {
    busy.value = false;
  }
}

async function toggleShare() {
  busy.value = true;
  try {
    await request(`/api/courses/${course.value.id}/share`, {
      method: 'POST',
      body: { shared: !course.value.isShared },
    });
    course.value.isShared = !course.value.isShared;
  } catch (e) {
    saveHint.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>
