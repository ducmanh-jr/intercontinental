import { load } from 'js-yaml'
import type { BlogMeta } from './blog'

// 运行时版 frontmatter 解析（与 vite.config 构建期插件 ?blogmeta 同构）。
// v2.18 起浏览器路径不再使用（meta 已在构建期解析），仅测试引用。

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

export function parseBlogPost(raw: string, slug: string): BlogMeta {
  const match = raw.match(FRONTMATTER_RE)
  const data = match ? ((load(match[1]) as Record<string, unknown>) ?? {}) : {}
  const content = match ? raw.slice(match[0].length) : raw
  if (typeof data.title !== 'string' || !data.title) {
    throw new Error(`[blog] ${slug}: frontmatter 缺少 title`)
  }
  if (typeof data.date !== 'string' && !(data.date instanceof Date)) {
    throw new Error(`[blog] ${slug}: frontmatter 缺少 date`)
  }
  const date =
    data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date)
  const tags = Array.isArray(data.tags) ? data.tags.map(String) : []
  return {
    slug,
    title: data.title,
    date,
    tags,
    desc: typeof data.desc === 'string' ? data.desc : '',
    content,
    category: typeof data.category === 'string' && data.category ? data.category : tags[0] ?? '',
    difficulty: typeof data.difficulty === 'number' ? Math.min(5, Math.max(1, data.difficulty)) : 0,
  }
}

export function listPosts(modules: Record<string, string>): BlogMeta[] {
  return Object.entries(modules)
    .map(([path, raw]) => {
      const slug = path.split('/').pop()!.replace(/\.md$/, '')
      return parseBlogPost(raw, slug)
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}
