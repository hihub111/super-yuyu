import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 旧浏览器兼容：为老手机/旧 WebView 生成 ES2015 回退包（支教老师手机型号杂）
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
  server: {
    host: '0.0.0.0', // 监听所有网卡，允许局域网访问
    port: 5173,      // 端口号
    open: true,      // 启动时自动打开浏览器（可选）
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  }
})