import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

/** 与 `src/api/config.ts` 中 `API_ORIGIN` 保持一致，供开发代理使用 */
const DEFAULT_API_ORIGIN = 'http://111.229.25.160:8001'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_TARGET || DEFAULT_API_ORIGIN

  return {
    // 部署在 http://<host>/ai-pred/ 子路径时需与服务器 location 一致
    base: '/ai-pred/',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api/v1': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
