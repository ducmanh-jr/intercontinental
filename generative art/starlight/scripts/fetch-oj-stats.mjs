// 构建时拉取洛谷 OJ 数据 → public/oj-stats.json（可选脚本，失败静默跳过）。
// 用法：在 CI 设置环境变量 LUOGU_UID（洛谷个人主页 luogu.com.cn/user/{uid} 里的数字）。
// 洛谷用户页 ?_contentOnly=1 返回 JSON（无需登录读公开字段）；牛客竞赛暂无公开 API，走手填数据。
import { writeFileSync } from 'node:fs'

const UID = process.env.LUOGU_UID || '1884717'

async function main() {
  if (!UID) {
    console.log('[oj-stats] LUOGU_UID 未设置，跳过（展示手填数据）')
    return
  }
  const res = await fetch(`https://www.luogu.com.cn/user/${UID}?_contentOnly=1`, {
    headers: { 'User-Agent': 'Mozilla/5.0 starlight-site', Referer: 'https://www.luogu.com.cn/' },
  })
  if (!res.ok) throw new Error(`luogu API ${res.status}`)
  const json = await res.json()
  const u = json?.currentData?.user
  if (!u) throw new Error('unexpected luogu payload')
  const out = {
    updatedAt: new Date().toISOString().slice(0, 10),
    luogu: {
      passed: u.passedProblemCount ?? null,
      submitted: u.submittedProblemCount ?? null,
      rating: u.rating ?? null,
    },
  }
  writeFileSync(new URL('../public/oj-stats.json', import.meta.url), JSON.stringify(out, null, 2))
  console.log('[oj-stats]', out)
}

try {
  await main()
} catch (e) {
  // 拉不到不阻断构建，前端回退到手填数据
  console.warn('[oj-stats] skipped:', e.message)
}
