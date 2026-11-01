import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-config-prettier'

// Regras de dependência entre pastas (docs/PLANO_TECNICO.md §5.1)
const features = ['audit', 'auth', 'dashboard', 'projects', 'rbac', 'repositories', 'settings']

const restrictImports = (...group) => ({
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        { group: ['../*'], message: 'Use o alias @/ em vez de ../' },
        { group, message: 'Import proibido entre estas pastas (ver PLANO_TECNICO §5.1).' },
      ],
    },
  ],
})

const boundaries = [
  { files: ['src/shared/**'], rules: restrictImports('@/app/**', '@/landing/**', '@/features/**') },
  { files: ['src/landing/**'], rules: restrictImports('@/app/**', '@/features/**') },
  ...features.map((feature) => ({
    files: [`src/features/${feature}/**`],
    rules: restrictImports(
      '@/app/**',
      '@/landing/**',
      '@/features/**',
      `!@/features/${feature}`,
      `!@/features/${feature}/**`,
    ),
  })),
]

export default [
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
    },
    settings: { react: { version: 'detect' } },
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react/prop-types': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-console': ['warn', { allow: ['error'] }],
      'no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      // Acessibilidade de elementos clicáveis: corrigida na fase de nova estrutura (shared/ui)
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/mouse-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
    },
  },
  ...boundaries,
  prettier,
]
