import { defineConfig } from 'vite';

// The daemon is a detached Node process spawned by main with
// ELECTRON_RUN_AS_NODE=1. It must not import anything from `electron`;
// `node-pty` is a native module and stays external. @xterm/headless and
// @xterm/addon-serialize resolve from app node_modules at runtime (same as
// headless) once SessionRuntime imports SerializeAddon.
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['electron', 'node-pty', '@xterm/headless', '@xterm/addon-serialize'],
    },
  },
  resolve: {
    conditions: ['node'],
    mainFields: ['module', 'main'],
  },
});
