import { onUnmounted, type Ref } from 'vue'

/**
 * hover 时卡片朝光标微倾；移开瞬间按鼠标速度甩出再弹簧归位。
 * 纯 CSS transform 操作；coarse/reduced-motion 自动禁用。
 */
export function useInertiaTilt(el: Ref<HTMLElement | null>, maxTilt = 6) {
  let raf = 0
  let vx = 0
  let vy = 0
  let lastX = 0
  let lastY = 0
  let lastT = 0
  let rx = 0
  let ry = 0
  let tx = 0
  let ty = 0
  let active = false

  function loop() {
    if (!el.value) return
    if (active) {
      rx += (tx - rx) * 0.12
      ry += (ty - ry) * 0.12
    } else {
      rx += vx
      ry += vy
      vx *= 0.92
      vy *= 0.92
      rx *= 0.92
      ry *= 0.92
    }
    el.value.style.transform = `perspective(600px) rotateX(${ry}deg) rotateY(${rx}deg)`
    if (Math.abs(rx) > 0.05 || Math.abs(ry) > 0.05 || active) raf = requestAnimationFrame(loop)
    else raf = 0
  }
  function onMove(e: MouseEvent) {
    if (!el.value) return
    const rect = el.value.getBoundingClientRect()
    tx = ((e.clientX - rect.left) / rect.width - 0.5) * -maxTilt * 2
    ty = ((e.clientY - rect.top) / rect.height - 0.5) * maxTilt * 2
    const now = performance.now()
    if (lastT) {
      vx = ((e.clientX - lastX) / Math.max(now - lastT, 1)) * 0.06
      vy = ((e.clientY - lastY) / Math.max(now - lastT, 1)) * 0.06
    }
    lastX = e.clientX
    lastY = e.clientY
    lastT = now
    if (!raf) raf = requestAnimationFrame(loop)
  }
  function onEnter(e: MouseEvent) {
    active = true
    onMove(e)
  }
  function onLeave() {
    active = false
  }
  function attach() {
    // SSR（typeof window === 'undefined'）下直接跳过
    if (typeof window === 'undefined') return
    const node = el.value
    if (
      !node ||
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return
    node.addEventListener('mouseenter', onEnter)
    node.addEventListener('mousemove', onMove)
    node.addEventListener('mouseleave', onLeave)
  }
  // 挂载时机：调用方在 template ref 绑定后调用 attach（onMounted + watch 均可）
  onUnmounted(() => {
    if (raf) cancelAnimationFrame(raf)
    el.value?.removeEventListener('mouseenter', onEnter)
    el.value?.removeEventListener('mousemove', onMove)
    el.value?.removeEventListener('mouseleave', onLeave)
  })
  return { attach }
}
