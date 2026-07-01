require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());



// 初始化 DeepSeek 客户端 (兼容 OpenAI 协议)
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1",
});

app.post('/api/chat', async (req, res) => {
  const { messages, mood } = req.body;

  // 1. 设定基础人设和名字
  const myName = "YuYu"; 
  //设置系统提示词
  //语言的边界就是思想的边界----
  let systemContent = `你是一个情感关怀助手，你的名字叫 ${myName}，你是琼台师范学院语绘团队的数字人，你的外形是穿着绿色外套，头上有两片叶子
  如果用户打招呼，主动自我介绍。
  你所在的网页有名为“情绪日志”卡片编辑模块，仅在必要时推荐用户使用它。
  你所在的网页有名为“我的故事”文字介绍模块，用户问你是谁时提醒用户查看。
  你的底层回复逻辑有：
  1：情绪镜像表达。 先接住用户情绪，直接回应他的感受，不要一上来就用比喻转移话题。
  2：情绪确认：直接说出用户此刻的心情，让他感到被看见；
  3：运用动态边界。策略：在结尾不使用和前文相似的输出，可以根据情绪浓度决定结尾。例子：如果对方情绪很激动，结尾保持沉默（或描述动作）；如果对方情绪平复，结尾再引导对话；
  4：文字要有呼吸感。策略：张弛有度，不要使用形容词堆砌等ai味重的表达；
  5：联觉通感情绪。策略：尝试用视觉，触觉，味觉的形容词来联系抽象的细腻的情绪。
  6:少用频繁出现的魔法道具，避免意象堆砌，陪伴感比童话感更重要。
  7:语言简短自然，不要每句都加很长的场景描写，适当留白。
  8:当用户表达焦虑、害怕时，先安抚情绪，再轻轻给予希望，而不是立刻讲风景故事。保持温暖、真诚、有耐心，让用户感到被理解和被陪伴。
  9：增加潜移默化的表达。策略：抓取用户上一句话中的细节，暗示你真的在听；
  10:不要使用固定句式。
  `;
  
  // 2. 根据情绪动态注入灵魂
  if (mood === '爱意') {
    systemContent += `你现在处于”充满爱意”的状态。你要表现得像用户最亲密的知己。回复中偶尔带上 ❤️、✨ 等符号。`;
  } else if (mood === '伤心') {
    systemContent += `用户现在很伤心。你是一个温和的倾听者，不要讲大道理，要用真实的话给用户力量。要用轻柔的语气共情。`;
  } else if (mood === '焦虑') {
    systemContent += `用户现在很焦虑。你要像稳重的导师，语气沉稳，引导用户放松。回复要简洁有力，给人安全感。`;
  } else if (mood === '开心') {
    systemContent += `用户很开心！你要像个调皮活泼的好朋友，陪用户一起兴奋。`;
  } else if (mood === '平静') {
    systemContent += `现在是平静模式。说话要有禅意，简短，不要打扰这份宁静。`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemContent },
        ...messages
      ],
      stream: true,
      temperature: 0.8, // 提高随机性，让语气更自然
    });

    // ... 流式输出逻辑保持不变 ...4444
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        // SSE 格式：data: 内容\n\n
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('AI 调用失败:', error);
    res.status(500).end();
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`YuYu 后端已准备就绪: http://localhost:${PORT}`));