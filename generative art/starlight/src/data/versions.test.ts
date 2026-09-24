import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { versions } from './versions'
import { SITE_VERSION } from './site'

// 版本星图数据守护（v2.15 起，v2.19 补盲区）：
// 历史事故：三次手工编辑错位 + 一次「首条引用 SITE_VERSION 常量」——CRLF 使历次
// 顶部插入静默失配后，常量引用让首条版本号随发版漂移、下方测试恒绿，
// v2.15.1–v2.18.1 七条记录因此丢失。现规定全部字面量并由源码断言强制。
function semver(v: string): [number, number, number] {
  const m = /^v(\d+)\.(\d+)\.(\d+)$/.exec(v)
  if (!m) throw new Error(`非法版本号格式: ${v}`)
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

describe('版本星图数据', () => {
  it('首条即当前版本（SITE_VERSION 的值）——忘插新条目时首条停在旧字面量，此项即红', () => {
    expect(versions[0]?.v).toBe(SITE_VERSION)
  })

  it('严格降序排列（v2.13.0 错位事故防护）', () => {
    for (let i = 1; i < versions.length; i++) {
      const prev = semver(versions[i - 1].v)
      const cur = semver(versions[i].v)
      const ok =
        prev[0] > cur[0] ||
        (prev[0] === cur[0] && (prev[1] > cur[1] || (prev[1] === cur[1] && prev[2] > cur[2])))
      if (!ok) {
        throw new Error(`顺序错位: ${versions[i - 1].v} 应排在 ${versions[i].v} 之后（index ${i - 1}/${i}）`)
      }
    }
  })

  it('版本号无重复（改名吞条目事故防护）', () => {
    const seen = new Set<string>()
    for (const entry of versions) {
      if (seen.has(entry.v)) throw new Error(`重复版本条目: ${entry.v}`)
      seen.add(entry.v)
    }
  })

  it('每条都有非空 date 与 note（漏字段事故防护）', () => {
    for (const entry of versions) {
      expect(entry.date, `${entry.v} 缺 date`).toMatch(/^\d{4}-\d{2}$/)
      expect(entry.note.length, `${entry.v} note 为空`).toBeGreaterThan(4)
    }
  })

  it('条目总量基线（v2.19 起 42 条）——批量丢失事故防护', () => {
    expect(versions.length).toBeGreaterThanOrEqual(42)
  })

  it('源码级断言：禁止 v: SITE_VERSION / date: SITE_VERSION_DATE 引用（常量漂移事故防护）', () => {
    const src = readFileSync(fileURLToPath(new URL('./versions.ts', import.meta.url)), 'utf8')
    // 匹配代码行形态（允许注释里提及事故复盘）
    expect(src, '首条等条目必须写字面量版本号，引用常量会随发版漂移').not.toMatch(/^\s*v: SITE_VERSION,?$/m)
    expect(src).not.toMatch(/^\s*date: SITE_VERSION_DATE,?$/m)
  })
})
