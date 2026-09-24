import { readFileSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs'

copyFileSync('dist/index.html', 'dist/404.html')

const redirectScript = `<script>
  (function () {
    var segments = location.pathname.split('/');
    var repo = segments[1] || '';
    var root = repo ? '/' + repo + '/' : '/';
    sessionStorage.redirect = location.href;
    location.replace(root);
  })();
</script>`

const html = readFileSync('dist/404.html', 'utf8')
  .replace('<head>', '<head>' + redirectScript)

writeFileSync('dist/404.html', html)

// ===== RSS（atom.xml）与 sitemap.xml（v2.4）=====
// 从 src/blog/*.md 的 frontmatter 提取 title/date/desc，构建期生成静态订阅源。
const SITE = 'https://xrk-hhh.github.io/starlight'

function parseFrontmatter(name) {
  const raw = readFileSync(`src/blog/${name}`, 'utf8')
  // \r 兼容：Windows 工作流写入的 md 为 CRLF，朴素 \n 正则会把全部文章过滤掉
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ''
  const pick = (key) =>
    fm.match(new RegExp(`^${key}:[ \t]*(.+?)[ \t]*\r?$`, 'm'))?.[1]?.trim() ?? ''
  return {
    slug: name.replace(/\.md$/, ''),
    title: pick('title').replace(/^["']|["']$/g, ''),
    date: pick('date'),
    desc: pick('desc').replace(/^["']|["']$/g, ''),
  }
}

const posts = readdirSync('src/blog')
  .filter((f) => f.endsWith('.md'))
  .map(parseFrontmatter)
  .filter((p) => p.title && p.date)
  .sort((a, b) => (a.date < b.date ? 1 : -1))

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>xrk-hhh · 星港日志</title>
  <subtitle>算法竞赛题解与项目手记</subtitle>
  <id>${SITE}/</id>
  <link rel="self" href="${SITE}/atom.xml"/>
  <updated>${posts[0]?.date ?? '2026-08-16'}T00:00:00Z</updated>
${posts
  .map(
    (p) => `  <entry>
    <title>${esc(p.title)}</title>
    <link href="${SITE}/blog/${p.slug}"/>
    <id>${SITE}/blog/${p.slug}</id>
    <updated>${p.date}T00:00:00Z</updated>
    <summary>${esc(p.desc)}</summary>
  </entry>`,
  )
  .join('\n')}
</feed>
`
writeFileSync('dist/atom.xml', atom)

const staticRoutes = ['', 'about', 'projects', 'blog', 'friends', 'guestbook', 'versions', 'now']
const allRoutes = [...staticRoutes, ...posts.map((p) => `blog/${p.slug}`)]
const urls = allRoutes.map((r) => `  <url><loc>${SITE}/${r}</loc></url>`).join('\n')
writeFileSync(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
)

console.log(`postbuild: 404 + atom.xml (${posts.length} 篇) + sitemap.xml (${allRoutes.length} URL)`)
