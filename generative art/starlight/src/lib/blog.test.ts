import { describe, it, expect } from 'vitest'
import { countWords, readingTimeMinutes } from './blog'
import { parseBlogPost, listPosts } from './blog-parse'

const sample = `---
title: 你好，世界
date: 2026-08-13
tags: [生活]
desc: 第一篇博客
---

# 正文

内容。`

describe('parseBlogPost', () => {
  it('解析 frontmatter 与正文', () => {
    const post = parseBlogPost(sample, '2026-08-13-hello')
    expect(post.slug).toBe('2026-08-13-hello')
    expect(post.title).toBe('你好，世界')
    expect(post.date).toBe('2026-08-13')
    expect(post.tags).toEqual(['生活'])
    expect(post.desc).toBe('第一篇博客')
    expect(post.content).toContain('# 正文')
  })

  it('缺少 title 时抛出错误', () => {
    const bad = `---\ndate: 2026-08-13\n---\n正文`
    expect(() => parseBlogPost(bad, 'x')).toThrow(/title/)
  })
})

describe('listPosts', () => {
  it('按 date 倒序排列', () => {
    const posts = listPosts({
      'a.md': sample,
      'b.md': `---\ntitle: 更早\ndate: 2025-01-01\ndesc: 二\n---\n`,
    })
    expect(posts.map((p) => p.date)).toEqual(['2026-08-13', '2025-01-01'])
  })
})

describe('countWords', () => {
  it('中文按字计', () => {
    expect(countWords('你好，世界')).toBe(4)
  })

  it('英文按词计', () => {
    expect(countWords('hello world')).toBe(2)
  })

  it('代码块不计入字数', () => {
    expect(countWords('```python\nprint(1)\n```\n\n你好')).toBe(2)
  })

  it('markdown 标记不计入字数（#、** 等被剥离）', () => {
    expect(countWords('# 标题\n\n**加粗** 内容')).toBe(6)
  })
})

describe('readingTimeMinutes', () => {
  it('400 字为 1 分钟', () => {
    expect(readingTimeMinutes('字'.repeat(400))).toBe(1)
  })

  it('401 字为 2 分钟（向上取整）', () => {
    expect(readingTimeMinutes('字'.repeat(401))).toBe(2)
  })

  it('空内容最小 1 分钟', () => {
    expect(readingTimeMinutes('')).toBe(1)
  })
})
