import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // three.js is large by nature; silence the expected warning for that chunk.
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        /**
         * Keep three.js / R3F out of the main bundle.
         * This chunk is only downloaded when the user activates 3D mode
         * (lazy-imported via Timeline3DWrapper → Timeline3D).
         */
        manualChunks: {
          "three-vendor": [
            "three",
            "@react-three/fiber",
            "@react-three/drei",
          ],
        },
      },
    },
  },
})
