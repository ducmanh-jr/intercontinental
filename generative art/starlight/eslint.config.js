import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      globals: {
        ...globals.browser,
        // gsap 的 Context/Timeline 等类型在全局 namespace（gsap 类型声明），运行时无此全局
        gsap: 'readonly',
      },
      parserOptions: { parser: tseslint.parser },
    },
  },
  eslintConfigPrettier,
)
