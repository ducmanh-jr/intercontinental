import { describe, it, expect } from 'vitest'
import { renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  it('渲染标题与链接', () => {
    const html = renderMarkdown('# 标题\n\n[链接](/blog/x)')
    expect(html).toContain('<h1>标题</h1>')
    expect(html).toContain('href="/blog/x"')
  })

  it('html: false —— 原始 HTML 被转义', () => {
    const html = renderMarkdown('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('python 代码块由 shiki 高亮', () => {
    const html = renderMarkdown('```python\nprint("hi")\n```')
    expect(html).toContain('class="shiki')
    expect(html).toContain('print')
  })

  it('未注册的语言优雅降级为纯文本', () => {
    const html = renderMarkdown('```ruby\nputs "hi"\n```')
    expect(html).toContain('puts')
  })
})
