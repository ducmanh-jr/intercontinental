import { ref, watch, onUnmounted, type Ref } from 'vue'

/**
 * 元素进入视口一次后，把 targets 从 0 滚动到目标值。
 * prefers-reduced-motion 时直接呈现终值。
 */
export function useCountUp(el: Ref<HTMLElement | null>, targets: () => number[], duration = 1200) {
  const values = ref<number[]>([])
  let raf = 0
  let observer: IntersectionObserver | null = null

  function animate(from: number, to: number, startedAt: number): number {
    const t = Math.min((performance.now() - startedAt) / duration, 1)
    const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
    return Math.round(from + (to - from) * eased)
  }

  function start(to: number[]) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      values.value = to
      return
    }
    const startedAt = performance.now()
    const step = () => {
      values.value = to.map((v) => animate(0, v, startedAt))
      if (performance.now() - startedAt < duration) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
  }

  watch(el, (node) => {
    observer?.disconnect() // 元素变化时先断开旧实例，防止泄漏
    if (!node) return
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer?.disconnect()
          start(targets())
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(node)
  })

  onUnmounted(() => {
    cancelAnimationFrame(raf)
    observer?.disconnect()
  })

  return { values }
}
