import { onMounted, onUnmounted } from 'vue'

const SEQUENCE = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']

export function useKonami(onTrigger: () => void) {
  let idx = 0
  const onKey = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return
    idx = e.key === SEQUENCE[idx] ? idx + 1 : (e.key === SEQUENCE[0] ? 1 : 0)
    if (idx === SEQUENCE.length) {
      idx = 0
      onTrigger()
    }
  }
  onMounted(() => window.addEventListener('keydown', onKey))
  onUnmounted(() => window.removeEventListener('keydown', onKey))
}
