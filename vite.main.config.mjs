// vite.main.config.mjs
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      // Mark all libraries with native or dynamic parts as external
      external: [
        'onnxruntime-web',
        '@xenova/transformers',
        'fluent-ffmpeg',
        '@ffmpeg-installer/ffmpeg',
      ],
    },
  },
});