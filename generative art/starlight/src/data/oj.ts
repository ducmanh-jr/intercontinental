// 算法星域数据（v1.9，已接入真实数据）：洛谷 / 牛客竞赛战绩展示。
// 数据来源：2026-08 抓取的公开主页（洛谷 uid=1884717 · 牛客竞赛 795825228）。
// 后续更新两条通道，优先级：public/oj-stats.json（构建脚本生成）> 本文件手填值。
// ① CI 自动：GitHub Actions 配环境变量 LUOGU_UID=1884717，
//    scripts/fetch-oj-stats.mjs 会在构建前拉取最新数据写入 public/oj-stats.json；
// ② 手动：直接改下面的数字。
export interface OjPlatformStats {
  name: string
  url: string
  mark: string
  passed: number | null
  submitted: number | null
  rating: number | null
  extra?: { label: string; value: string } | null
}

export const ojStats: OjPlatformStats[] = [
  {
    name: '洛谷',
    url: 'https://www.luogu.com.cn/user/1884717',
    mark: '◈',
    passed: 488,
    submitted: 489,
    rating: null,
    extra: { label: '全站排名', value: '7.59k · 通过率 99.8%' },
  },
  {
    name: '牛客竞赛',
    url: 'https://ac.nowcoder.com/acm/contest/profile/795825228',
    mark: '◇',
    passed: 170,
    submitted: 347,
    rating: 1635,
    extra: { label: 'Rating 排名', value: '3961 · 19 场比赛' },
  },
]
