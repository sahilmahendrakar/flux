import { defineConfig } from 'vite';

// The daemon is a detached Node process spawned by main with
// ELECTRON_RUN_AS_NODE=1. It must not import anything from `electron`;
// `node-pty` is a native module and stays external. @xterm/headless is
// pure JS and is allowed to bundle.
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['electron', 'node-pty', '@xterm/headless'],
    },
  },
  resolve: {
    conditions: ['node'],
    mainFields: ['module', 'main'],
  },
});
