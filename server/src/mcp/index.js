import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { skillRegistry, runSkill } from '../skills/index.js';

// 语语 MCP 服务器：把技能注册表暴露为 MCP 工具（stdio 独立进程）
// Claude Desktop 配置：{"mcpServers":{"yuyu":{"command":"node","args":["/绝对路径/server/src/mcp/index.js"]}}}
const server = new McpServer({ name: 'yuyu', version: '0.1.0' });

for (const [name, skill] of Object.entries(skillRegistry)) {
  server.registerTool(
    name,
    { title: name, description: skill.description, inputSchema: skill.params.shape },
    async (args) => {
      // MCP 直调：无 SSE 通道、无课程上下文，emit 为空实现
      // 统一走 runSkill：参数校验 + 异常归一化为 {ok:false,error}
      const result = await runSkill(name, args, { emit: () => {} });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        isError: !result.ok,
      };
    }
  );
}

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`语语 MCP 服务器已启动，共 ${Object.keys(skillRegistry).length} 个工具`);
