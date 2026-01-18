import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    hmr: {
        overlay: false // Անջատում է էկրանի վրայի սխալների շերտը
    }
  }
})