import MarkdownIt from 'markdown-it'
import { fromHighlighter } from '@shikijs/markdown-it/core'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import type { BundledLanguage } from 'shiki'

const md = new MarkdownIt({
  html: false, // 安全：不渲染原始 HTML（XSS 防线）
  linkify: true,
})

// shiki 在模块加载时初始化；本模块仅被 BlogPostView（懒加载路由）引用，
// 因此 shiki 与语法包只进入博客详情页 chunk，不进入首屏。
// 采用 shiki/core 细粒度集成（官方 fine-grained bundle 推荐形态）：
// 只注册文章实际用到的语言，避免 bundle-full 把全部内置语言打进产物。
const highlighter = await createHighlighterCore({
  // v2.15 双主题：深色主题 One Dark Pro，浅色主题（纸笺/樱庭）经 CSS 切到 GitHub Light，
  // 浅色页面不再被黑底代码块打断（shiki dual-theme 输出 --shiki-light 变量组）
  themes: [import('@shikijs/themes/one-dark-pro'), import('@shikijs/themes/github-light')],
  langs: [import('@shikijs/langs/python'), import('@shikijs/langs/cpp')],
  // JS 正则引擎（v2.4）：替代 oniguruma+wasm——博客路由少加载一个 622KB
  // （gzip 232KB）的 chunk，语法着色结果一致；shiki 官方推荐的轻量路径。
  // forgiving：个别文法的正则在不支持最新 V8 特性的运行时上降级而非抛错。
  engine: createJavaScriptRegexEngine({ forgiving: true }),
})

md.use(
  fromHighlighter(
    // @shikijs/markdown-it 的 HighlighterGeneric 与 HighlighterCore
    // 存在泛型不变性冲突（"Type 'any' is not assignable to type 'never'"），
    // 属 @shikijs/markdown-it@4 边界的已知类型噪声，运行时同源。
    highlighter as unknown as Parameters<typeof fromHighlighter>[0],
    {
      themes: { light: 'github-light', dark: 'one-dark-pro' },
      // 默认渲染深色值（inline color: var(--shiki-dark)），浅色主题由 main.css 覆盖变量
      defaultColor: 'dark',
      // 'text' 是 shiki 运行时的特殊纯文本语言（isPlainLang 白名单），
      // 但未收录进 BundledLanguage 类型联合，此处显式断言。
      // 未注册的语言由此优雅降级为纯文本，不抛错。
      fallbackLanguage: 'text' as BundledLanguage,
    },
  ),
)

// v2.1：h2/h3 生成锚点 id（中文保留、空白转连字符），供文章目录与锚链跳转
const slugify = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')

const defaultHeadingOpen = md.renderer.rules.heading_open
md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
  const tag = tokens[idx].tag
  if (tag === 'h2' || tag === 'h3') {
    const text = tokens[idx + 1]?.content ?? ''
    return `<${tag} id="${slugify(text)}">`
  }
  return defaultHeadingOpen
    ? defaultHeadingOpen(tokens, idx, options, env, self)
    : `<${tag}>`
}

// v2.12.1：外链新标签打开——文章里的洛谷/GitHub 等链接不再把访客带离本站
const defaultLinkOpen = md.renderer.rules.link_open
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = String(tokens[idx].attrGet('href') ?? '')
  if (/^https?:\/\//i.test(href)) {
    tokens[idx].attrSet('target', '_blank')
    tokens[idx].attrSet('rel', 'noopener noreferrer')
  }
  return defaultLinkOpen
    ? defaultLinkOpen(tokens, idx, options, env, self)
    : self.renderToken(tokens, idx, options)
}

// v2.1：正文图片懒加载——文章多图且多在首屏之下，滚动到再拉取
const defaultImage = md.renderer.rules.image
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('loading', 'lazy')
  tokens[idx].attrSet('decoding', 'async')
  return defaultImage
    ? defaultImage(tokens, idx, options, env, self)
    : self.renderToken(tokens, idx, options)
}

export function renderMarkdown(src: string): string {
  return md.render(src)
}
