<template>
  <div class="flex flex-col h-[100dvh] w-screen watercolor-bg overflow-hidden font-sans text-[#4A5D4E] relative">
    <div class="absolute inset-0 bg-white/40 z-0"></div>

    <transition name="fade">
      <div v-if="isMenuOpen" class="absolute inset-0 bg-black/20 z-50 transition-opacity" @click="isMenuOpen = false"></div>
    </transition>
    <transition name="slide">
      <div v-if="isMenuOpen" class="absolute left-0 top-0 h-full w-[70%] max-w-[280px] bg-[#F8FAF9] shadow-2xl z-50 flex flex-col pt-12 pb-6 px-6 rounded-r-[30px]">
        <button @click="isMenuOpen = false" class="absolute top-4 right-4 text-gray-400 p-2"><X size="24" /></button>
        <div class="flex items-center gap-3 mb-8">
          <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-pink-100">
            <span class="text-[14px] font-bold text-[#7A907E]">Yu</span>
          </div>
          <span class="font-bold text-lg text-[#4A5D4E]">拓展</span>
        </div>
        
        <nav class="flex-1 space-y-2">
          <button @click="openHistory" class="w-full flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-white transition-colors text-left font-medium text-[#5a6b5e]">
            <History size="20" class="text-[#8EACCD]" /> 情绪日志
          </button>
          
          <button @click="openMyStory" class="w-full flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-white transition-colors text-left font-medium text-[#5a6b5e]">
            <TrendingUp size="20" class="text-[#A2C579]" /> 我的故事
          </button>
          
          <button @click="openCommunityStory" class="w-full flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-white transition-colors text-left font-medium text-[#5a6b5e]">
            <Users size="20" class="text-[#FFD966]" /> 社区故事 
          </button>
          
          <button class="w-full flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-white transition-colors text-left font-medium text-[#5a6b5e]">
            <Leaf size="20" class="text-[#FF8A8A]" /> 正念练习 
          </button>
        </nav>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showHistory" class="absolute inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
        <div class="bg-white rounded-[24px] w-full max-w-md h-[70vh] flex flex-col shadow-2xl overflow-hidden">
          
          <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-[#F8FAF9]">
            <div class="flex items-center gap-2">
              <button v-if="isEditingNote" @click="isEditingNote = false" class="p-1"><ChevronLeft size="20"/></button>
              <h3 class="font-bold text-[#4A5D4E]">{{ isEditingNote ? '编辑笔记' : '心事卡片集' }}</h3>
            </div>
            <button @click="showHistory = false" class="p-1"><X size="20" class="text-gray-400"/></button>
          </div>

          <div v-if="!isEditingNote" class="flex-1 flex flex-col overflow-hidden">
            <div class="p-4 overflow-y-auto flex-1 space-y-3">
              <button @click="editNote(-1)" class="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                <Plus size="20" /> 新建一张卡片
              </button>

              <div v-for="(note, index) in notes" :key="index" 
                  class="p-4 bg-white rounded-xl border border-gray-100 shadow-sm relative group active:scale-[0.98] transition-transform"
                  @click="editNote(index)">
                <p class="text-[10px] text-gray-400 mb-1">{{ note.date }}</p >
                <h4 class="font-bold text-[#4A5D4E] mb-1">{{ note.title || '无标题' }}</h4>
                <p class="text-sm text-gray-500 line-clamp-2 leading-relaxed">{{ note.content }}</p >
                
                <button @click.stop="deleteNote(index)" class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 text-red-300 hover:text-red-500">
                  <Trash2 size="16" />
                </button>
              </div>
              
              <div v-if="notes.length === 0" class="py-12 text-center text-gray-300">
                还没有记录过心情呢...
              </div>
            </div>
          </div>

          <div v-else class="flex-1 flex flex-col p-4 space-y-4">
            <input 
              v-model="currentNote.title" 
              placeholder="给这张卡片起个名字..."
              class="text-lg font-bold outline-none border-b border-gray-100 pb-2 text-[#4A5D4E]"
            />
            <textarea 
              v-model="currentNote.content" 
              placeholder="在这里写下你想说的话..."
              class="flex-1 outline-none resize-none text-[15px] leading-relaxed text-gray-600"
            ></textarea>
            <button @click="saveNote" class="w-full py-3 bg-[#7A907E] text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all">
              保存记录
            </button>
          </div>

        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showTextModal" class="absolute inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
        <div class="bg-white rounded-[24px] w-full max-w-md h-[60vh] flex flex-col shadow-2xl overflow-hidden">
          
          <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-[#F8FAF9]">
            <h3 class="font-bold text-[#4A5D4E]">{{ modalTitle }}</h3>
            <button @click="showTextModal = false" class="p-1"><X size="20" class="text-gray-400"/></button>
          </div>

          <div class="flex-1 p-6 overflow-y-auto bg-white">
            <p class="text-[15px] leading-relaxed text-gray-600 whitespace-pre-wrap">{{ modalContent }}</p >
          </div>

        </div>
      </div>
    </transition>

    <div class="flex flex-col h-full w-full relative z-10">
      
      <header class="bg-white/90 backdrop-blur-md rounded-b-[30px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-3 px-5 flex items-center justify-between z-40 shrink-0 border-b border-white">
        <div class="flex items-center gap-3">
          <button @click="isMenuOpen = true" class="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <Menu size="24" class="text-[#7A907E]" />
          </button>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-[#E8F0E9] rounded-full flex items-center justify-center">
              <img src="./assets/yuyu-hand.png" class="w-8 h-8 rounded-full object-cover" />
            </div>
            <span class="font-bold text-[15px] tracking-tight opacity-50 uppercase">Yuyu: 情感关怀</span>
          </div>
        </div>
      </header>

      <div class="flex-1 flex flex-col overflow-hidden relative">
        <section 
          :class="[
            'relative shrink-0 flex items-center justify-center z-30 mt-2 transition-all duration-700 ease-in-out',
            hasSelectedMood ? 'h-[25vh] -translate-y-4' : 'h-[40vh]'
          ]"
        >
          <div class="relative w-full max-w-[320px] h-full flex items-center justify-center">
            
            <div class="yuyu-mask w-[180px] h-[180px] border-4 border-white shadow-xl bg-[#E8F0E9] overflow-hidden pointer-events-auto">
              <video 
                ref="yuyuVideo"
                class="w-full h-full object-cover scale-110" 
                autoplay loop muted playsinline
                src="/yuyu-1.mp4">
              </video>
            </div>

            <transition name="fade-out">
              <div v-if="!hasSelectedMood" class="mood-buttons-container">
                <button v-for="mood in moodOptions" :key="mood.label"
                  @click="handleMoodClick(mood)"
                  :class="['absolute flex flex-col items-center gap-1 transition-all z-50', mood.position]"
                >
                  <div 
                    :class="['w-11 h-11 rounded-full flex items-center justify-center mood-glow animate-glow shadow-lg', mood.bgColor]"
                    :style="{ '--glow-color': mood.glowColor }"
                  >
                    <component :is="mood.icon" class="text-white" size="20" />
                  </div>
                  <span class="text-[11px] font-medium mt-1 opacity-80 text-[#4A5D4E]">{{ mood.label }}</span>
                </button>
              </div>
            </transition>
          </div>
        </section>

        <main class="flex-1 overflow-y-auto px-4 py-2 space-y-4 z-10" ref="chatBox">
          <div v-for="(msg, i) in messages" :key="i" 
               :class="['flex w-full', msg.role === 'user' ? 'justify-end' : 'justify-start']">
            
            <div :class="['max-w-[85%] px-4 py-3 rounded-[20px] shadow-sm text-[15px] leading-relaxed relative overflow-hidden', 
                        msg.role === 'user' ? 'bg-[#7A907E] text-white rounded-tr-none' : 'bg-white/20 backdrop-blur-sm text-[#4A5D4E] rounded-tl-none leaf-紋理-bg']">
              {{ msg.content }}
            </div>
          </div>
          <div class="h-4"></div>
        </main>
      </div>

      <footer class="bg-white/95 backdrop-blur-xl rounded-t-[30px] shadow-[0_-10px_30px_rgba(0,0,0,0.04)] px-5 py-4 pb-8 z-40 shrink-0 border-t border-white flex flex-col gap-4">
        
        <div class="w-full max-w-2xl mx-auto bg-[#F1F6F2] rounded-[24px] p-1.5 pl-4 flex items-end gap-2 leaf-紋理-bg relative overflow-hidden transition-all focus-within:ring-2 ring-[#A2C579]/50">
          <textarea 
            v-model="inputText"
            @input="adjustHeight"
            rows="1"
            placeholder="给 YuYu 留言..."
            class="flex-1 max-h-32 py-2.5 outline-none resize-none text-[16px] bg-transparent z-10 text-[#4A5D4E]"
          ></textarea>
          <button 
            @click="sendMessage"
            :disabled="!inputText.trim()"
            class="p-2.5 bg-[#7A907E] disabled:bg-gray-300 rounded-full text-white transition-all shadow-sm z-10 shrink-0"
          >
            <Send size="18" />
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, markRaw, nextTick } from 'vue';
import { Menu, Send, Heart, Sun, CloudRain, RotateCcw, X, History, TrendingUp, Users, Leaf, Plus, Trash2, ChevronLeft } from 'lucide-vue-next';

// 菜单与弹窗状态
const isMenuOpen = ref(false);
const showHistory = ref(false);

// 弹窗状态
const showTextModal = ref(false);
const modalTitle = ref('');
const modalContent = ref('');

const myStoryText = `嗨～我是yuyu呀
你可以叫我小雨雨，也可以喊我语语～我的名字里藏着超温柔的心意哦
一层是「语绘」的“语”，代表着我们语绘支教团队想用声音和画笔，把美好传递给每一个孩子；另一层是海南热带雨林的“雨”，是滋养万物、守护成长的温柔力量，所以我没有固定的汉字，就像雨林里的风与雨，自由又治愈～
我身上这件软软的斗篷，印满了海南热带雨林里的可爱植物🌱 每一片叶子都在提醒我：要当好孩子们的成长小伙伴，把绿色生态知识带进课堂，让更多小朋友了解海南雨林、爱上自然，践行“绿水青山就是金山银山”的理念～
我是语绘支教团队的情感关怀数字人，会陪着孩子们一起学习、一起成长，用温暖和陪伴守护每一份童真，用知识和热爱点亮每一个童年`;

const communityStoryText = `欢迎来到“社区故事”
🌿 语绘支教团队 · 蔚蓝师语实践团
 
✨ 团队简介
 
“语绘童心，绿耀琼乡”蔚蓝师语实践团于2024年6月成立，隶属琼台师范学院团委。我们以支教为纽带，用多维育人模式服务超250名乡村学生，将优质教育、海南少数民族文化与生态保护深度融合，用青春力量助力乡村振兴，让每一个孩子都能在爱与陪伴中成长。
 
🏆 我们的闪光荣誉
 
1. 入选2024年关爱行动“七彩假期”志愿服务团队
2. 入选2024年“中国历代绘画大系”大学生志愿宣讲团队
3. 入选2024年“推普助力乡村振兴”全国大学生暑期社会实践志愿服务活动
4. 团队成员荣获2024年海南省万名大学生基层科普行优秀科技志愿者
5. 入选2025年“推普助力乡村振兴”全国大学生暑期社会实践志愿服务活动
6. 荣获2025年“推普助力乡村振兴”全国大学生暑期社会实践志愿服务活动优秀团队
7. 荣获2025年“榜样100”全国优秀大学生团队
8. 荣获第十二届“挑战杯”海南省大学生课外学术科技作品竞赛省级三等奖
9. 荣获2025年文化科技卫生“三下乡”活动校级优秀团队
10. 荣获2025年海南万名大学生基层科普行活动优秀科技团队
11. 受人民网、学习强国、海南日报、中青校园等多家主流媒体报道
12. 受山海乐东、五指山融媒体、五指山新闻、澄迈共青团等多家地方媒体报道
 
 
 
🎨 我们的趣味支教课堂
 
🔬 科学科普类
 
奇迹反应秀、一飞冲天·水火箭实验、基于空气动力学的纸飞机项目式学习、悬浮纸飞机、简易航模制作、剡木成舟等
 
🎨 美育与文化传承类
 
制作手摇国旗、布里生花：遇见扎染、琼韵指尖生：脸谱与漆扇、解锁福安古窑：陶土制作、海南非遗传统公仔戏创作、共和国脊梁戏剧表演等
 
💛 心理健康与素养类
 
健康小达人：探寻长寿密码、感统训练、护送小船接力赛、亲子嘉年华等
`;

const openMyStory = () => {
  isMenuOpen.value = false;
  modalTitle.value = '我的故事';
  modalContent.value = myStoryText;
  setTimeout(() => { showTextModal.value = true; }, 300);
};

const openCommunityStory = () => {
  isMenuOpen.value = false; 
  modalTitle.value = '社区故事';
  modalContent.value = communityStoryText;
  setTimeout(() => { 
    showTextModal.value = true; 
  }, 300);
};

const currentMood = ref(''); 

const moodOptions = [
  { label: '爱意', icon: markRaw(Heart), bgColor: 'bg-[#FF8A8A]', glowColor: 'rgba(255, 138, 138, 0.6)', position: 'top-[5%] left-[5%]', moodKey: '充满爱意' },
  { label: '伤心', icon: markRaw(CloudRain), bgColor: 'bg-[#8EACCD]', glowColor: 'rgba(142, 172, 205, 0.6)', position: 'top-[45%] left-[-5%]', moodKey: '伤心' },
  { label: '开心', icon: markRaw(Sun), bgColor: 'bg-[#FFD966]', glowColor: 'rgba(255, 217, 102, 0.6)', position: 'bottom-[0%] left-[8%]', moodKey: '开心' },
  { label: '平静', icon: markRaw(Leaf), bgColor: 'bg-[#A2C579]', glowColor: 'rgba(162, 197, 121, 0.6)', position: 'top-[45%] right-[-5%]', moodKey: '平静' },
  { label: '焦虑', icon: markRaw(RotateCcw), bgColor: 'bg-[#B08BBB]', glowColor: 'rgba(176, 139, 187, 0.6)', position: 'bottom-[0%] right-[8%]', moodKey: '焦虑' },
];

const chatBox = ref(null);
const messages = ref([
  { role: 'assistant', content: '你好呀,点击我身边的按钮告诉我你的心情吧！' }
]);
const inputText = ref('');

const sendMessage = async (manualText = null) => {
  // 核心修复：判断传入的是不是字符串。如果是点击事件对象，就忽略它
  let userText = typeof manualText === 'string' ? manualText : inputText.value.trim();

  if (!userText) return;

  messages.value.push({ role: 'user', content: userText });

  if (typeof manualText !== 'string') {
    inputText.value = '';
  }

  scrollToBottom();

  const aiMsg = { role: 'assistant', content: '' };
  messages.value.push(aiMsg);

  try {
const apiUrl = `${window.location.protocol}//${window.location.hostname}:3000/api/chat`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        messages: messages.value,
        mood: currentMood.value
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.replace('data: ', '');
          if (dataStr === '[DONE]') break;
          
          try {
            const data = JSON.parse(dataStr);
            const index = messages.value.indexOf(aiMsg);
            messages.value[index].content += data.content; 
            scrollToBottom();
          } catch (e) { }
        }
      }
    }
  } catch (error) {
    aiMsg.content = "抱歉，YuYu 刚才走神了，请再跟我说一次吧。";
  }
};

const hasSelectedMood = ref(false);

const handleMoodClick = (moodObj) => {
  if (hasSelectedMood.value) return;
  hasSelectedMood.value = true;
  currentMood.value = moodObj.label;
  const moodTexts = {
    爱意: "我感觉心里暖暖的。",
    伤心: "我今天心情有点低落...",
    开心: "今天遇到了超级开心的事！",
    平静: "我感觉很平静。",
    焦虑: "我有点焦虑。"
  };
  
  sendMessage(moodTexts[moodObj.label]);
};

// 笔记本模块
const notes = ref(JSON.parse(localStorage.getItem('yuyu-notes') || '[]'));
const isEditingNote = ref(false); // 是否处于编辑状态
const editingNoteIndex = ref(-1); // 正在编辑哪一条（-1 表示新建）
const currentNote = ref({ title: '', content: '', date: '' });

// 保存到本地
const saveToLocal = () => {
  localStorage.setItem('yuyu-notes', JSON.stringify(notes.value));
};

// 打开笔记本列表
const openHistory = () => {
  isMenuOpen.value = false;
  isEditingNote.value = false; // 默认打开是列表页
  setTimeout(() => { showHistory.value = true; }, 300);
};

// 进入新建/编辑
const editNote = (index = -1) => {
  editingNoteIndex.value = index;
  if (index === -1) {
    // 新建
    currentNote.value = { 
      title: '', 
      content: '', 
      date: new Date().toLocaleDateString() 
    };
  } else {
    // 编辑现有
    currentNote.value = { ...notes.value[index] };
  }
  isEditingNote.value = true;
};

// 保存笔记
const saveNote = () => {
  if (!currentNote.value.content.trim()) return;
  
  if (editingNoteIndex.value === -1) {
    notes.value.unshift({ ...currentNote.value });
  } else {
    notes.value[editingNoteIndex.value] = { ...currentNote.value };
  }
  saveToLocal();
  isEditingNote.value = false;
};

// 删除笔记
const deleteNote = (index) => {
  notes.value.splice(index, 1);
  saveToLocal();
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight;
  });
};

const adjustHeight = (e) => {
  e.target.style.height = 'auto';
  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
};
</script>

<style scoped>
/* 保持你的图片路径正确 */
.watercolor-bg {
  background-image: url("./assets/watercolor-bg.png"); 
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #fcf4f6; 
}

.leaf-紋理-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("./assets/leaf-pattern.png");
  background-repeat: repeat;
  background-size: 300px; 
  opacity: 0.40; 
  pointer-events: none;
  z-index: 0;
}
.leaf-紋理-bg > * { position: relative; z-index: 10; }

/* 情绪按钮光晕 */
.mood-glow {
  border: none !important; 
  box-shadow: 0 0 15px var(--glow-color), 0 0 25px var(--glow-color);
  transition: all 0.3s ease;
}
.mood-glow:active {
  transform: scale(0.9);
  box-shadow: 0 0 20px var(--glow-color), 0 0 40px var(--glow-color);
}
@keyframes pulse-glow {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}
.animate-glow { animation: pulse-glow 3s infinite ease-in-out; }

/* 确保 section 的高度变化有过渡动画 */
section {
  /* cubic-bezier 让动画更有“弹出”和“收回”的灵动感 */
  transition: height 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 按钮消失的动画 */
.fade-out-leave-active {
  transition: all 0.4s ease;
}

.fade-out-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.yuyu-mask {
  border-radius: 60% 40% 70% 30% / 40% 50% 60% 40%;
  animation: morph 8s ease-in-out infinite;
  z-index: 40;
}
@keyframes morph {
  0% { border-radius: 60% 40% 70% 30% / 40% 50% 60% 40%; }
  50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
  100% { border-radius: 60% 40% 70% 30% / 40% 50% 60% 40%; }
}

::-webkit-scrollbar { display: none; }

/* Vue 动画过渡效果 */
.slide-enter-active, .slide-leave-active { transition: transform 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(-100%); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
