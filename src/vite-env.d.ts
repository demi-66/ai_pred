/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 可选，完整 API 基址；不设置则生产环境使用 config.ts 的 API_ORIGIN + /api/v1 */
  readonly VITE_API_BASE?: string
  /** 开发时 Vite 代理目标，与 API_ORIGIN 一致 */
  readonly VITE_API_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
