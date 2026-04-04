/**
 * 统一后端服务根地址（协议 + IP + 端口，无路径）。
 * 所有 REST 接口基址为：`${getApiBase()}` → 形如 `http://111.229.25.160:8001/api/v1`
 *
 * - 本地开发（npm run dev）：走 Vite 代理 `/api/v1` → 同源无跨域，代理目标见 `.env` 的 `VITE_API_TARGET`
 * - 生产构建：默认直连本常量；可用环境变量 `VITE_API_BASE` 覆盖完整基址
 */
export const API_ORIGIN = 'http://111.229.25.160:8001'

export function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_BASE?.trim()
  if (fromEnv && (fromEnv.startsWith('http://') || fromEnv.startsWith('https://')))
    return fromEnv.replace(/\/$/, '')

  const origin = API_ORIGIN.replace(/\/$/, '')
  const withApiV1 = `${origin}/api/v1`

  if (typeof window !== 'undefined' && window.location.protocol === 'file:')
    return withApiV1

  // 开发模式：浏览器请求 /api/v1，由 vite.config 代理到 VITE_API_TARGET（即 API_ORIGIN）
  if (import.meta.env.DEV)
    return '/api/v1'

  return withApiV1
}
