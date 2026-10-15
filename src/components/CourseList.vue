<template>
  <div class="flex flex-col h-full">
    <!-- 顶栏 -->
    <header class="bg-white/90 backdrop-blur-md rounded-b-[30px] shadow-sm px-5 py-3 flex items-center justify-between shrink-0 z-40">
      <div class="flex items-center gap-2.5">
        <img src="../assets/yuyu-hand.png" class="w-9 h-9 rounded-full object-cover" alt="语语" />
        <div>
          <p class="font-bold text-[15px] leading-tight">语语 · 课程工作台</p>
          <p class="text-[11px] opacity-50 leading-tight">{{ user.displayName }} · {{ user.studentId }}</p>
        </div>
      </div>
      <button @click="doLogout" class="text-sm px-4 py-2 rounded-xl bg-[#F1F6F2] hover:bg-[#E8F0E9] font-medium transition-colors">
        退出
      </button>
    </header>

    <!-- 主区 -->
    <main class="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
      <!-- 标签页 -->
      <div class="flex rounded-2xl bg-white/80 backdrop-blur p-1 shadow-sm">
        <button v-for="t in tabs" :key="t.key" @click="tab = t.key"
          :class="['flex-1 py-2.5 rounded-xl text-sm font-bold transition-all',
                   tab === t.key ? 'bg-white shadow text-[#4A5D4E]' : 'text-gray-400']">
          {{ t.label }}
        </button>
      </div>

      <!-- 新建课程 -->
      <button v-if="tab === 'mine'" @click="showNewDialog = true"
        class="w-full py-3.5 border-2 border-dashed border-[#A2C579]/60 rounded-2xl text-[#7A907E] font-bold flex items-center justify-center gap-2 hover:bg-white/60 transition-colors">
        <Plus size="18" /> 新建课程
      </button>

      <p v-if="error" class="text-sm text-red-400 px-2">{{ error }}</p>

      <!-- 我的课程 -->
      <template v-if="tab === 'mine'">
        <div v-for="c in myCourses" :key="c.id" @click="$router.push(`/courses/${c.id}`)"
          class="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-sm cursor-pointer active:scale-[0.98] transition-transform">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="font-bold text-[15px] truncate">{{ c.title }}</h3>
              <p class="text-xs opacity-50 mt-0.5">{{ c.courseType }} · {{ c.gradeRange }}年级 · 更新于 {{ c.updatedAt.slice(0, 10) }}</p>
            </div>
            <span :class="['shrink-0 text-[11px] px-2.5 py-1 rounded-full font-bold',
                          c.status === 'plan_confirmed' ? 'bg-[#A2C579]/20 text-[#7A907E]'
                          : c.status === 'done' ? 'bg-blue-100 text-blue-500' : 'bg-gray-100 text-gray-400']">
              {{ statusLabels[c.status] || c.status }}
            </span>
          </div>
          <button @click.stop="removeCourse(c)"
            class="mt-2 text-[11px] text-red-300 hover:text-red-500 font-medium">删除</button>
        </div>
        <div v-if="!myCourses.length" class="py-12 text-center text-sm opacity-40">
          还没有课程，点击上方「新建课程」开始吧
        </div>
      </template>

      <!-- 团队课程库 -->
      <template v-else>
        <div v-for="c in sharedCourses" :key="c.id"
          class="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="font-bold text-[15px] truncate">{{ c.title }}</h3>
              <p class="text-xs opacity-50 mt-0.5">{{ c.ownerName }} · {{ c.courseType }} · {{ c.gradeRange }}年级</p>
            </div>
            <button @click="copyCourse(c)"
              class="shrink-0 text-xs px-3 py-1.5 rounded-full bg-[#7A907E]/10 text-[#7A907E] font-bold hover:bg-[#7A907E]/20 transition-colors">
              复制到我的课程
            </button>
          </div>
        </div>
        <div v-if="!sharedCourses.length" class="py-12 text-center text-sm opacity-40">
          团队课程库还是空的，把做好的课分享进来吧
        </div>
      </template>
    </main>

    <!-- 新建课程对话框 -->
    <transition name="fade">
      <div v-if="showNewDialog" class="absolute inset-0 bg-black/40 z-[60] flex items-end sm:items-center justify-center" @click.self="showNewDialog = false">
        <div class="bg-white rounded-t-[24px] sm:rounded-[24px] w-full max-w-md p-6 shadow-2xl">
          <h3 class="font-bold text-lg mb-4">新建课程</h3>
          <div class="space-y-3">
            <input v-model="newCourse.title" placeholder="课目，例如：会跳舞的牛奶"
              class="w-full px-4 py-3 rounded-xl bg-[#F8FAF9] outline-none text-[15px] focus:ring-2 ring-[#A2C579]/50" />
            <select v-model="newCourse.courseType"
              class="w-full px-4 py-3 rounded-xl bg-[#F8FAF9] outline-none text-[15px]">
              <option v-for="t in courseTypes" :key="t" :value="t">{{ t }}类课程</option>
            </select>
            <div class="flex gap-3">
              <input v-model="newCourse.gradeRange" placeholder="年级范围，如 1-6"
                class="flex-1 px-4 py-3 rounded-xl bg-[#F8FAF9] outline-none text-[15px] focus:ring-2 ring-[#A2C579]/50" />
              <input v-model="newCourse.meta.人数" placeholder="学生总数"
                class="w-28 px-4 py-3 rounded-xl bg-[#F8FAF9] outline-none text-[15px] focus:ring-2 ring-[#A2C579]/50" />
            </div>
            <div class="flex gap-3">
              <input v-model="newCourse.meta.课时" placeholder="课时(分钟)，如 80"
                class="flex-1 px-4 py-3 rounded-xl bg-[#F8FAF9] outline-none text-[15px] focus:ring-2 ring-[#A2C579]/50" />
              <input v-model="newCourse.meta.可用物资" placeholder="可用物资"
                class="flex-[2] px-4 py-3 rounded-xl bg-[#F8FAF9] outline-none text-[15px] focus:ring-2 ring-[#A2C579]/50" />
            </div>
            <div class="flex gap-3 pt-2">
              <button @click="showNewDialog = false"
                class="flex-1 py-3 rounded-xl bg-[#F1F6F2] font-bold text-gray-500">取消</button>
              <button @click="createCourse" :disabled="busy"
                class="flex-[2] py-3 bg-[#7A907E] disabled:bg-gray-300 text-white rounded-xl font-bold shadow active:scale-95 transition-all">
                {{ busy ? '创建中…' : '创建并进入' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Plus } from 'lucide-vue-next';
import { request } from '../api/index.js';
import { user, logout } from '../composables/useAuth.js';
import { COURSE_TYPES, STATUS_LABELS } from '../schema.js';

const router = useRouter();
const tabs = [{ key: 'mine', label: '我的课程' }, { key: 'team', label: '团队课程库' }];
const tab = ref('mine');
const courseTypes = COURSE_TYPES;
const statusLabels = STATUS_LABELS;

const myCourses = ref([]);
const sharedCourses = ref([]);
const error = ref('');
const busy = ref(false);

const showNewDialog = ref(false);
const newCourse = ref({ title: '', courseType: '科学', gradeRange: '1-6', meta: { 人数: '', 课时: '', 可用物资: '' } });

async function load() {
  try {
    const [mine, shared] = await Promise.all([
      request('/api/courses'),
      request('/api/courses?shared=1'),
    ]);
    myCourses.value = mine;
    sharedCourses.value = shared;
  } catch (e) {
    error.value = e.message;
  }
}
onMounted(load);

async function createCourse() {
  if (!newCourse.value.title.trim()) return;
  busy.value = true;
  try {
    const c = await request('/api/courses', { method: 'POST', body: {
      title: newCourse.value.title,
      courseType: newCourse.value.courseType,
      gradeRange: newCourse.value.gradeRange,
      meta: newCourse.value.meta,
    }});
    router.push(`/courses/${c.id}`);
  } catch (e) {
    error.value = e.message;
    busy.value = false;
  }
}

async function copyCourse(c) {
  try {
    const full = await request(`/api/courses/${c.id}`);
    const mine = await request('/api/courses', { method: 'POST', body: {
      title: `${full.title}（副本）`,
      courseType: full.courseType,
      gradeRange: full.gradeRange,
      meta: full.meta,
      planJson: full.planJson,
      scriptMd: full.scriptMd,
      materialsJson: full.materialsJson,
      safetyJson: full.safetyJson,
    }});
    router.push(`/courses/${mine.id}`);
  } catch (e) {
    error.value = e.message;
  }
}

async function removeCourse(c) {
  if (!confirm(`确定删除「${c.title}」吗？删除后不可恢复`)) return;
  try {
    await request(`/api/courses/${c.id}`, { method: 'DELETE' });
    myCourses.value = myCourses.value.filter((x) => x.id !== c.id);
  } catch (e) {
    error.value = e.message;
  }
}

async function doLogout() {
  await logout();
  router.push('/login');
}
</script>
