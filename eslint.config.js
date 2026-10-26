import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const renderingLibraries = ['vue', 'vue/*', 'three', 'three/*', '@tresjs/*']

/** Production code reads the map of the game; only the map catalog, the engine facade and the tests name the classic map. */
const classicMapImport = {
  group: ['**/engine', '**/engine/index', '**/maps', '**/maps/index', '**/maps/classic', './classic'],
  importNames: ['classicMap'],
  message: 'Read the map of the game with mapOf(state) or mapById(mapId) instead of the classic map.',
}
const classicMapAllowed = [
  'src/engine/maps/**',
  'src/engine/index.ts',
  'src/**/*.test.ts',
  'src/engine/testUtils.ts',
  'src/ai/testScenarios.ts',
]

export default defineConfig(
  { ignores: ['dist/', 'coverage/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  pluginVue.configs['flat/recommended'],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.vue'],
    ignores: classicMapAllowed,
    rules: {
      'no-restricted-imports': ['error', { patterns: [classicMapImport] }],
    },
  },
  {
    files: ['src/engine/**/*.ts', 'src/ai/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: renderingLibraries,
              message: 'The rules engine and the AI must stay independent from Vue and Three.js.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/engine/**/*.ts', 'src/ai/**/*.ts'],
    ignores: classicMapAllowed,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: renderingLibraries,
              message: 'The rules engine and the AI must stay independent from Vue and Three.js.',
            },
            classicMapImport,
          ],
        },
      ],
    },
  },
)
