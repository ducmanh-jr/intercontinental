// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'

const sample = `---
title: 你好，世界
date: 2026-08-13
tags: [生活]
desc: 第一篇博客
---

# 正文

内容。`

describe('parseBlogPost（浏览器环境回归）', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('不依赖 Node Buffer：解析 frontmatter 与正文', async () => {
    // 模拟浏览器：抹掉 Node 全局 Buffer（jsdom env 仍运行在 Node 上，需显式抹除）
    vi.stubGlobal('Buffer', undefined)
    const { parseBlogPost, listPosts } = await import('./blog-parse')
    const post = parseBlogPost(sample, '2026-08-13-hello')
    expect(post.slug).toBe('2026-08-13-hello')
    expect(post.title).toBe('你好，世界')
    expect(post.date).toBe('2026-08-13')
    expect(post.tags).toEqual(['生活'])
    expect(post.desc).toBe('第一篇博客')
    expect(post.content).toContain('# 正文')
    expect(listPosts({ 'x.md': sample })).toHaveLength(1)
  })
})
