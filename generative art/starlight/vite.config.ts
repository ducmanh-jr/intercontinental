import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import { load as yamlLoad } from 'js-yaml'
import type { Plugin } from 'vite'

/**
 * v2.18 性能核心：构建期 frontmatter 提取插件。
 * `import.meta.glob('…*.md', { query: '?blogmeta' })` 得到的模块在构建期就把
 * YAML frontmatter 解析成对象导出（与 parseBlogPost 输出同构、content 为空串），
 * 浏览器端列表/统计/今日一题因此不再需要打包 36 篇全文（-225KB raw / -85KB gzip）
 * 和运行时 js-yaml；全文走 ?raw 懒加载，按需单篇成 chunk。
 */
function blogMetaPlugin(): Plugin {
  return {
    name: 'starlight-blog-meta',
    enforce: 'pre',
    load(id) {
      const [file, query = ''] = id.split('?')
      if (!file.endsWith('.md') || !query.includes('blogmeta')) return
      // md id 通常是根相对 POSIX 路径（/src/blog/x.md）；vitest 里是绝对路径
      // （POSIX /home/… 或 Windows D:/…）。path.resolve 对两种都正确。
      const abs = resolve(process.cwd(), file)
      const raw = readFileSync(abs, 'utf8')
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
      const fm = (m ? yamlLoad(m[1]) : {}) as Record<string, unknown>
      const tags = Array.isArray(fm.tags) ? fm.tags.map(String) : []
      // 校验对齐 blog-parse 的 parseBlogPost：坏 frontmatter 直接构建失败（fail fast），
      // 不允许静默空标题混进列表
      if (typeof fm.title !== 'string' || !fm.title) {
        throw new Error(`[blogmeta] ${file}: frontmatter 缺少 title`)
      }
      if (typeof fm.date !== 'string' && !(fm.date instanceof Date)) {
        throw new Error(`[blogmeta] ${file}: frontmatter 缺少 date`)
      }
      const meta = {
        slug: file.split('/').pop()!.replace(/\.md$/, ''),
        title: String(fm.title ?? ''),
        date: fm.date instanceof Date ? fm.date.toISOString().slice(0, 10) : String(fm.date ?? ''),
        tags,
        desc: typeof fm.desc === 'string' ? fm.desc : '',
        content: '',
        category: typeof fm.category === 'string' && fm.category ? fm.category : (tags[0] ?? ''),
        difficulty:
          typeof fm.difficulty === 'number' ? Math.min(5, Math.max(1, fm.difficulty)) : 0,
      }
      return `export default ${JSON.stringify(meta)}`
    },
  }
}

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/starlight/',
  plugins: [
    blogMetaPlugin(),
    vue(),
    tailwindcss(),
    // dev：把生产子路径 /starlight/* 重写回根路径，
    // 博文里的绝对图片链接（/starlight/images/…）本地预览时也能显示
    {
      name: 'starlight-base-rewrite-dev',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url?.startsWith('/starlight')) req.url = req.url.slice('/starlight'.length) || '/'
          next()
        })
      },
    },
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      output: {
        // 首屏小 chunk 合并：减少 slow-4G 下请求数（LCP 优化）。按需分包（ParticleScene/BlogPostView 等）不受影响
        advancedChunks: {
          groups: [
            {
              name: 'app-utils',
              priority: 20,
              test: /(useApi|particles|preload-helper|_plugin-vue_export-helper|profile)/,
            },
          ],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
