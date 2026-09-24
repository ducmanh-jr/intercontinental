import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 打字机轮播：逐字打出 words[i]，停顿后删除，循环下一个。
 * prefers-reduced-motion 时直接静态返回第一个词。
 */
export function useTypewriter(words: string[], options: { typeMs?: number; deleteMs?: number; pauseMs?: number } = {}) {
  const { typeMs = 90, deleteMs = 45, pauseMs = 1400 } = options
  const text = ref(words[0] ?? '')
  let timer: ReturnType<typeof setTimeout> | null = null

  function schedule(fn: () => void, ms: number) {
    timer = setTimeout(fn, ms)
  }

  function cleanup() {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  function start() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || words.length < 2) {
      text.value = words[0] ?? ''
      return
    }
    let wi = 0
    let ci = words[0]?.length ?? 0
    let deleting = true
    const tick = () => {
      const word = words[wi]
      if (deleting) {
        ci--
        text.value = word.slice(0, Math.max(ci, 0))
        if (ci <= 0) {
          deleting = false
          wi = (wi + 1) % words.length
          schedule(tick, pauseMs)
          return
        }
        schedule(tick, deleteMs)
      } else {
        ci++
        text.value = words[wi].slice(0, ci)
        if (ci >= words[wi].length) {
          deleting = true
          schedule(tick, pauseMs)
          return
        }
        schedule(tick, typeMs)
      }
    }
    schedule(tick, pauseMs)
  }

  onMounted(start)
  onUnmounted(cleanup)

  return { text }
}
