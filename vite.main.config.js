// vite.main.config.js
import { defineConfig } from 'vite';
import commonjs from '@rollup/plugin-commonjs';

export default defineConfig({
  plugins: [
    // Adicione o plugin do commonjs com a configuração necessária
    commonjs({
      dynamicRequireTargets: [
        // Diga ao Vite para incluir todos os arquivos .node da biblioteca onnxruntime
        'node_modules/onnxruntime-web/dist/bin/**/*.node',
      ],
    }),
  ],
});