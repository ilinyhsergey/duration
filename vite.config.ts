import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts({ tsconfigPath: './tsconfig.json', include: ['src'], entryRoot: 'src' })],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Duration',
      formats: ['es', 'cjs'],
      fileName: (format) => `duration.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      // сюда имена peerDependencies, чтобы они не попадали в бандл
      external: [],
    },
    sourcemap: true,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/model/**'],
    },
  },
})
