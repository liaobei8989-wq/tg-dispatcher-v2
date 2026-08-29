import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: {
        ignored: [
          '**/sessions/**',
          '**/sessions',
          '**/*.db*',
          '**/*.session',
          '**/*.log',
          '**/*.bak',
          '**/*.pyc',
          '**/*auto_scanner_stats*',
          '**/*stats*',
          '**/stats.json',
          '**/__pycache__/**'
        ]
      },
    },
  };
});
