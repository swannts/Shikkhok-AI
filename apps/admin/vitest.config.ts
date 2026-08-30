import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@fuse': path.resolve(__dirname, './src/@fuse'),
      '@auth': path.resolve(__dirname, './src/@auth'),
      '@i18n': path.resolve(__dirname, './src/@i18n'),
    },
  },
});
