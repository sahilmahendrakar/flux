import { chmodSync, copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

function copyFluxxCliShims(): Plugin {
  return {
    name: 'copy-fluxx-cli-shims',
    writeBundle(outputOptions) {
      const outDir = outputOptions.dir ?? path.join(repoRoot, '.vite/build');
      for (const [srcName, dstName] of [
        ['fluxx-shim', 'fluxx'],
        ['flux-shim', 'flux'],
      ] as const) {
        const shimSrc = path.join(repoRoot, 'scripts', srcName);
        const shimDst = path.join(outDir, dstName);
        if (!existsSync(shimSrc)) return;
        copyFileSync(shimSrc, shimDst);
        try {
          chmodSync(shimDst, 0o755);
        } catch {
          // ignore chmod failures on Windows
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [copyFluxxCliShims()],
  build: {
    lib: {
      entry: path.join(repoRoot, 'src/flux-cli/main.ts'),
      formats: ['cjs'],
      fileName: () => 'fluxx-cli.js',
    },
    outDir: path.join(repoRoot, '.vite/build'),
    emptyOutDir: false,
    rollupOptions: {
      external: [],
    },
  },
});
