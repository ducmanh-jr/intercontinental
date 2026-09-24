// 构建时拉取公开仓库统计 + 贡献日历，写入 public/*.json（由 deploy.yml 在 npm run build 前调用）
// 运行于 GitHub Actions，GITHUB_TOKEN 有 public_repo 读权限；本地手动运行需设置 GH_TOKEN。
import { writeFileSync } from 'node:fs'

const USER = 'xrk-hhh'

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'starlight-site',
  ...(process.env.GH_TOKEN ? { Authorization: `Bearer ${process.env.GH_TOKEN}` } : {}),
}

async function fetchStats() {
  const repoRes = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&type=owner`, { headers })
  if (!repoRes.ok) throw new Error(`repos API ${repoRes.status}`)
  const repos = await repoRes.json()
  const mine = repos.filter((r) => !r.fork && !r.archived && r.visibility === 'public')
  const stats = {
    repos: mine.length,
    stars: mine.reduce((s, r) => s + (r.stargazers_count ?? 0), 0),
    updatedAt: new Date().toISOString().slice(0, 10),
  }
  writeFileSync(new URL('../public/github-stats.json', import.meta.url), JSON.stringify(stats, null, 2))
  console.log('[github-stats]', stats)
}

// 贡献日历（近一年）→ public/github-contributions.json，供「贡献星图」渲染：
// GraphQL（有 token 时，Actions 内置 GITHUB_TOKEN 即可）优先，失败退回公共镜像 API。
// 贡献数据拿不到只降级（前端隐藏星图），不影响主统计。
async function fetchContributions() {
  const days = []
  let total = 0

  if (process.env.GH_TOKEN) {
    try {
      const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query($login:String!){ user(login:$login){ contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } } } }`,
          variables: { login: USER },
        }),
      })
      const json = await res.json()
      const calendar = json?.data?.user?.contributionsCollection?.contributionCalendar
      if (calendar?.weeks) {
        total = calendar.totalContributions ?? 0
        for (const week of calendar.weeks) {
          for (const d of week.contributionDays) {
            days.push({ date: d.date, count: d.contributionCount })
          }
        }
      }
    } catch (e) {
      console.warn('[github-contributions] graphql failed:', e.message)
    }
  }

  if (days.length === 0) {
    const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${USER}?y=last`)
    if (!res.ok) throw new Error(`contributions API ${res.status}`)
    const json = await res.json()
    total = json.total?.last_year ?? 0
    for (const d of json.contributions ?? []) {
      days.push({ date: d.date, count: d.count })
    }
  }

  if (days.length === 0) throw new Error('empty contributions')
  const out = {
    total,
    updatedAt: new Date().toISOString().slice(0, 10),
    // 只保留最近 364 天（52 周 × 7），前端按 7 行网格渲染
    days: days.slice(-364),
  }
  writeFileSync(new URL('../public/github-contributions.json', import.meta.url), JSON.stringify(out))
  console.log('[github-contributions]', { total, days: out.days.length })
}

async function main() {
  await fetchStats()
  try {
    await fetchContributions()
  } catch (e) {
    console.warn('[github-contributions] skipped:', e.message)
  }
}

main().catch((e) => {
  console.error('[github-stats] failed:', e.message)
  process.exit(1)
})
