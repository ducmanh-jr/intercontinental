<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'

// 四芒星路径（24x24 视口）
const STAR_PATH =
  'M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z'

// 触屏 / reduced-motion：渲染空，不挂载任何监听
const coarse = window.matchMedia('(pointer: coarse)').matches
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const enabled = !coarse && !reducedMotion

const pos = reactive({ x: 0, y: 0 })
const visible = ref(false)
const hovering = ref(false)
const bubble = ref('')

// 拖尾：最近 4 个采样点（60ms 间隔），渲染除最新外的 3 个，最近的越亮越大
const trail = ref<{ x: number; y: number }[]>([])
const trailDots = computed(() => trail.value.slice(0, -1).slice(-3).reverse())
const DOT_OPACITY = [0.5, 0.3, 0.15]
const DOT_SIZE = [8, 5, 3]

let targetX = 0
let targetY = 0
let raf = 0
let lastSample = 0

function loop() {
  pos.x += (targetX - pos.x) * 0.22
  pos.y += (targetY - pos.y) * 0.22
  raf = requestAnimationFrame(loop)
}

function onPointerMove(e: PointerEvent) {
  targetX = e.clientX
  targetY = e.clientY
  if (!visible.value) visible.value = true
  const now = performance.now()
  if (now - lastSample >= 60) {
    lastSample = now
    trail.value = [...trail.value.slice(-3), { x: e.clientX, y: e.clientY }]
  }
}

// 构建 base（dev '/'，线上 '/starlight/'）：href 先规范化为 pathname 再匹配
const basePath = new URL(import.meta.env.BASE_URL, location.origin).pathname.replace(/\/$/, '')

function labelFor(pathname: string): string {
  if (pathname.endsWith('/blog') || pathname.includes('/blog/')) return '阅读'
  if (pathname.endsWith('/projects') || pathname.includes('/projects/')) return '探索'
  if (pathname === basePath || pathname === `${basePath}/` || pathname === '/') return '返航'
  return 'GO'
}

// hover 语义：document 级事件委托，通用规则映射标签
function onPointerOver(e: PointerEvent) {
  const target = e.target
  if (!(target instanceof Element)) {
    hovering.value = false
    bubble.value = ''
    return
  }
  const link = target.closest('a, button, [role="button"]')
  if (!link) {
    hovering.value = false
    bubble.value = ''
    return
  }
  // 取实际携带 href 的锚点（button 嵌套在链接内时向上找）
  const anchor = link instanceof HTMLAnchorElement ? link : link.closest('a')
  const href = anchor instanceof HTMLAnchorElement ? anchor.href : ''
  bubble.value = href ? labelFor(new URL(href, location.origin).pathname) : 'GO'
  hovering.value = true
}

onMounted(() => {
  if (!enabled) return
  pos.x = window.innerWidth / 2
  pos.y = window.innerHeight / 2
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  document.addEventListener('pointerover', onPointerOver, { passive: true })
  raf = requestAnimationFrame(loop)
})

onUnmounted(() => {
  if (!enabled) return
  cancelAnimationFrame(raf)
  window.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerover', onPointerOver)
})
</script>

<template>
  <div v-if="enabled" class="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden="true">
    <svg class="absolute h-0 w-0" aria-hidden="true">
      <defs>
        <linearGradient id="starcursor-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style="stop-color: var(--color-primary)" />
          <stop offset="100%" style="stop-color: var(--color-accent)" />
        </linearGradient>
      </defs>
    </svg>

    <!-- 拖尾小星点：position 直接取历史坐标，不做动画 -->
    <span
      v-for="(dot, i) in trailDots"
      :key="i"
      class="absolute -translate-x-1/2 -translate-y-1/2"
      :style="{ left: `${dot.x}px`, top: `${dot.y}px` }"
    >
      <svg
        :width="DOT_SIZE[i]"
        :height="DOT_SIZE[i]"
        viewBox="0 0 24 24"
        :style="{ opacity: DOT_OPACITY[i] }"
      >
        <path :d="STAR_PATH" fill="url(#starcursor-grad)" />
      </svg>
    </span>

    <!-- 主星标 -->
    <div
      class="star-follow absolute"
      :class="{ 'star-follow--hover': hovering }"
      :style="{ left: `${pos.x}px`, top: `${pos.y}px`, opacity: visible ? 1 : 0 }"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" class="star-glow glow-cursor">
        <path :d="STAR_PATH" fill="url(#starcursor-grad)" />
      </svg>
    </div>

    <!-- hover 语义气泡：星标右下方 16px -->
    <div
      v-show="hovering"
      class="star-bubble absolute rounded-full border border-primary/40 bg-bg/90 px-2.5 py-1 font-mono text-xs text-text"
      :style="{ left: `${pos.x + 16}px`, top: `${pos.y + 16}px` }"
    >
      {{ bubble }}
    </div>
  </div>
</template>

<style scoped>
.star-follow {
  transform: translate(-50%, -50%) scale(1);
  transition:
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.2s ease;
  will-change: transform;
}
.star-follow--hover {
  transform: translate(-50%, -50%) scale(1.8);
}
.star-glow {
  display: block;
}
</style>
