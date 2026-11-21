import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Deployed to https://<user>.github.io/cyber-security-network-protection-techniques/
// on GitHub Pages, so the repo name is the base path (dev and preview use it too).
export default defineConfig({
  base: '/cyber-security-network-protection-techniques/',
  plugins: [react()],
})
