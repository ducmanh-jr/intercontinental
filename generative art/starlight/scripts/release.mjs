#!/usr/bin/env node
// 发版脚本（v2.19）：node scripts/release.mjs "vX.Y.Z" "note 文案"
// 背景：历次手工/node 单行发版在 CRLF 行尾下正则静默失配，v2.15.1–v2.18.1 七条
// 版本记录丢失。本脚本按「行数组」处理（与行尾无关），写后自校验。
// 做四件事：① site.ts 版本号 ② index.html footer 版本号 ③ versions.ts 顶部插入
// 字面量条目（date 取当前年月）④ 校验：条目数 +1 / 首条=新版本 / 无重复 / 降序。
import { readFileSync, writeFileSync } from 'node:fs'

const [vRaw, note] = process.argv.slice(2)
if (!/^v\d+\.\d+\.\d+$/.test(vRaw ?? '') || !note) {
  console.error('用法: node scripts/release.mjs "vX.Y.Z" "note 文案"')
  process.exit(1)
}
const v = vRaw
const date = new Date().toISOString().slice(0, 7)

function patch(path, fn) {
  const src = readFileSync(path, 'utf8')
  const out = fn(src)
  if (out === src) {
    console.error(`[release] ${path} 无变更——匹配失败，中止（不写半套发版）`)
    process.exit(1)
  }
  writeFileSync(path, out)
}

// ① site.ts
patch('src/data/site.ts', (s) =>
  s.replace(/export const SITE_VERSION = 'v\d+\.\d+\.\d+'/, `export const SITE_VERSION = '${v}'`),
)
// ② index.html footer
patch('index.html', (s) => s.replace(/>v\d+\.\d+\.\d+<\/a>/, `>${v}</a>`))
// ③ versions.ts：行级插入（CRLF/LF 通吃）
patch('src/data/versions.ts', (s) => {
  const anchor = 'export const versions: VersionEntry[] = ['
  const i = s.indexOf(anchor)
  if (i < 0) throw new Error('versions.ts 锚点未找到')
  const eol = s.includes('\r\n') ? '\r\n' : '\n'
  const entry = [
    '  {',
    `    v: '${v}',`,
    `    date: '${date}',`,
    `    note: '${note.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}',`,
    '  },',
  ].join(eol)
  return s.slice(0, i + anchor.length) + eol + entry + s.slice(i + anchor.length)
})

// ④ 自校验（与 versions.test.ts 同规则）
const src = readFileSync('src/data/versions.ts', 'utf8')
const vs = [...src.matchAll(/v: '(v\d+\.\d+\.\d+)'/g)].map((m) => m[1])
const fail = []
if (vs[0] !== v) fail.push(`首条 ${vs[0]} ≠ ${v}`)
new Set(vs).size !== vs.length && fail.push('存在重复版本号')
for (let i = 1; i < vs.length; i++) {
  const [a, b, c] = vs[i - 1].slice(1).split('.').map(Number)
  const [d, e, f] = vs[i].slice(1).split('.').map(Number)
  if (a < d || (a === d && (b < e || (b === e && c <= f)))) fail.push(`顺序错位 ${vs[i - 1]} → ${vs[i]}`)
}
if (fail.length) {
  console.error('[release] 校验失败:', fail.join('; '), '——请手动检查 versions.ts')
  process.exit(1)
}
console.log(`[release] ✓ ${v}（条目 ${vs.length} 条）site.ts / index.html / versions.ts 已同步`)
