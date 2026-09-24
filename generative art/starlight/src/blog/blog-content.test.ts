/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseBlogPost } from '@/lib/blog-parse'
import { renderMarkdown } from '@/lib/markdown'

// v2.18：blog 全文不再 eager 进运行时（列表走构建期 meta），测试直接读源目录
const dir = fileURLToPath(new URL('.', import.meta.url))
const files = readdirSync(dir).filter((f: string) => f.endsWith('.md'))
const entries = files.map((f: string) => [f, readFileSync(dir + f, 'utf8')] as const)

describe('真实文章内容', () => {
  it('共 36 篇文章且 frontmatter 完整（title/date/tags/desc）', () => {
    expect(entries).toHaveLength(36)
    for (const [path, raw] of entries) {
      const slug = path.replace(/\.md$/, '')
      const post = parseBlogPost(raw, slug)
      expect(post.title).toBeTruthy()
      expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(post.tags.length).toBeGreaterThan(0)
      expect(post.desc).toBeTruthy()
      expect(post.content.trim().length).toBeGreaterThan(0)
    }
  })

  // v2.15：双主题 shiki 高亮（每个 token 计算两套主题色）使全量渲染耗时接近翻倍，
  // CI 机器上会超过 vitest 默认 5s——放宽到 30s（本地约 1-2s）
  it(
    '文章正文可安全渲染（无原始 script，正文不含重复 h1）',
    () => {
      for (const [path, raw] of entries) {
        const slug = path.replace(/\.md$/, '')
        const post = parseBlogPost(raw, slug)
        const html = renderMarkdown(post.content)
        expect(html).not.toContain('<script>')
        // h1 由 BlogPostView 用 post.title 渲染，正文里不应再出现
        expect(html).not.toContain('<h1>')
      }
    },
    30_000,
  )
})
