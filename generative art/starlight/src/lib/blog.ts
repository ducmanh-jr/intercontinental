// v2.18 性能重构：列表数据与全文分离。
// blogMetas：构建期解析的 frontmatter（vite 插件 ?blogmeta，与 parseBlogPost 输出同构、
// content 为空串）——列表/统计/今日一题/上下篇全部走这里，36 篇全文不再进列表路径，
// 运行时也不再需要 js-yaml。
// blogRaws：全文懒加载（?raw 非 eager），文章页按 slug 取，单篇独立 chunk。
// parseBlogPost / listPosts（运行时 frontmatter 解析族）已抽至 ./blog-parse，仅测试使用。

export interface BlogMeta {
  slug: string
  title: string
  date: string
  tags: string[]
  desc: string
  content: string
  /** 一级分类（算法竞赛/生活/项目/AI…）；缺省时回退到第一个 tag */
  category: string
  /** 难度 1~5 星（v2.6）；非算法文缺省为 0（不显示） */
  difficulty: number
}

export const blogMetas = import.meta.glob('../blog/*.md', {
  query: '?blogmeta',
  import: 'default',
  eager: true,
}) as Record<string, BlogMeta>

export const blogRaws = import.meta.glob('../blog/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

/** 列表（同步、零解析）：meta 已在构建期展开，按日期倒序 */
export function listPostMetas(metas: Record<string, BlogMeta>): BlogMeta[] {
  return Object.values(metas).sort((a, b) => (a.date < b.date ? 1 : -1))
}

/** 取单篇全文（懒加载 chunk）；找不到返回 null（404 由调用方处理） */
export async function loadPostRaw(slug: string): Promise<string | null> {
  const hit = blogRaws['../blog/' + slug + '.md']
  return hit ? hit() : null
}

/** 统计字数：中文按字符计，英文按空格分词计；忽略代码块与 markdown 标记 */
export function countWords(markdown: string): number {
  const noCode = markdown.replace(/```[\s\S]*?```/g, ' ')
  // eslint-disable-next-line no-useless-escape -- \[ 必须保留：V8 实测类内未转义的 [ 会使后续 ] 提前闭合字符类（()!| 被挤出类外），ESLint 判为无用转义属误报
  const noMarkdown = noCode.replace(/[#>*`\-_\[\]()!|]/g, ' ')
  const cjk = (noMarkdown.match(/[\u4e00-\u9fff]/g) ?? []).length
  const latin = (noMarkdown.match(/[a-zA-Z0-9]+/g) ?? []).length
  return cjk + latin
}

/** 阅读时长（分钟，向上取整）：中文 400 字/分，英文 200 词/分（简化：总字数按 400/分） */
export function readingTimeMinutes(markdown: string): number {
  return Math.max(1, Math.ceil(countWords(markdown) / 400))
}
