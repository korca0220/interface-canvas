/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // 상대 경로로 빌드해서 GitHub Pages 하위 경로(/interface-canvas/)와 로컬 양쪽에서 동작하게 한다.
  // 라우터가 없는 단일 페이지라 상대 경로로 충분하다.
  base: './',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
