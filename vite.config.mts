import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig(async ({ command }) => {
  const { default: tailwindcss } = await import('@tailwindcss/vite');

  return {
    base: command === 'serve' ? '/' : './',
    plugins: [
      tailwindcss(),
    ],
    server: {
      host: '127.0.0.1',
      port: 5174,
      strictPort: true,
      hmr: {
        protocol: 'wss',
        host: 'dev-amp.ka2.org',
        clientPort: 443,
        path: '/vite/',
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      manifest: 'manifest.json',
      rollupOptions: {
        input: resolve(__dirname, 'src/scripts/ambient.ts'),
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name][extname]',
        },
      },
    },
  };
});
