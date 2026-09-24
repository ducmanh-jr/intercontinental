import { reactive } from 'vue'

export type ParticleDensity = 'high' | 'low' | 'off'

// 纯 Vue reactive 单例（非 Pinia），由 router.afterEach 写入
export const particlesState = reactive({
  density: 'low' as ParticleDensity,
})

// 音乐电平（v2.12）：MusicPlayer 的 WebAudio analyser 每帧写入，
// ParticleScene.tick 每帧读取。故意不用 reactive——60fps 写响应式对象会白付触发开销。
export const audioLevel = { value: 0 }

const DENSITY_COUNT: Record<ParticleDensity, number> = {
  high: 1000,
  low: 300,
  off: 0,
}

export function resolveParticleCount(density: ParticleDensity, isMobile: boolean): number {
  if (isMobile) return 0
  return DENSITY_COUNT[density]
}
