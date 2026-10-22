import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: { name: 'engine', environment: 'node', include: ['src/engine/**/*.test.ts'] },
        },
        {
          extends: true,
          test: { name: 'ai', environment: 'node', include: ['src/ai/**/*.test.ts'] },
        },
        {
          extends: true,
          test: {
            name: 'ui',
            environment: 'happy-dom',
            include: ['src/**/*.test.ts'],
            exclude: ['src/engine/**', 'src/ai/**'],
          },
        },
      ],
    },
  }),
)
