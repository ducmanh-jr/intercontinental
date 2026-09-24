import { describe, it, expect } from 'vitest'
import { resolveParticleCount } from './particles'

describe('resolveParticleCount', () => {
  it('移动端一律为 0（不渲染）', () => {
    expect(resolveParticleCount('high', true)).toBe(0)
    expect(resolveParticleCount('low', true)).toBe(0)
  })
  it('桌面档位映射', () => {
    expect(resolveParticleCount('high', false)).toBe(1000)
    expect(resolveParticleCount('low', false)).toBe(300)
    expect(resolveParticleCount('off', false)).toBe(0)
  })
})
