import { defineConfig } from 'vite';

/**
 * Vite config for the Phaser HTML5 game.
 * Host 0.0.0.0 so Expo Go / devices on LAN can reach the dev server.
 */
export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
});
