<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const visible = ref(false)
const progress = ref(0) // 0-100 滚动进度，驱动外圈进度环
const R = 19 // 进度环半径
const CIRC = 2 * Math.PI * R

function onScroll() {
  visible.value = window.scrollY > 400
  const max = document.documentElement.scrollHeight - window.innerHeight
  progress.value = max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0
}

// 火箭发射（v1.7.2）：点击后图标向上窜出并淡出，再平滑滚回顶部
const launching = ref(false)
let launchTimer: number | undefined
function scrollTop() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    window.scrollTo({ top: 0, behavior: 'auto' })
    return
  }
  launching.value = true
  window.clearTimeout(launchTimer)
  launchTimer = window.setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    launching.value = false
  }, 220)
}
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.clearTimeout(launchTimer)
})
</script>

<template>
  <Transition name="fade">
    <button
      v-if="visible"
      aria-label="回到顶部"
      title="回到顶部"
      class="group fixed right-4 top-20 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-surface/70 shadow-lg shadow-black/30 backdrop-blur transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
      @click="scrollTop"
    >
      <!-- 滚动进度环：青→紫渐变，随页面滚动填充 -->
      <svg viewBox="0 0 48 48" class="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="topRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style="stop-color: var(--color-primary)" />
            <stop offset="1" style="stop-color: var(--color-accent)" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" :r="R" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2.5" />
        <circle
          cx="24"
          cy="24"
          :r="R"
          fill="none"
          stroke="url(#topRing)"
          stroke-width="2.5"
          stroke-linecap="round"
          :stroke-dasharray="CIRC"
          :stroke-dashoffset="CIRC * (1 - progress / 100)"
          class="transition-[stroke-dashoffset] duration-150"
        />
      </svg>
      <!-- 火箭：hover 轻微上浮 + 尾焰点亮，点击发射 -->
      <span class="relative block text-text-muted transition-all duration-300 group-hover:-translate-y-0.5 group-hover:text-primary" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          class="block h-5 w-5"
          :class="{ 'rocket-launch': launching }"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        </svg>
        <span
          class="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary opacity-0 shadow-[0_0_6px_rgba(34,211,238,0.9)] transition-opacity duration-300 group-hover:animate-pulse group-hover:opacity-100"
        ></span>
      </span>
      <!-- 百分比小字：hover 时显示当前滚动深度 -->
      <span class="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-[10px] tabular-nums text-text-muted/0 transition-colors duration-300 group-hover:text-text-muted/70">
        {{ progress }}%
      </span>
    </button>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
/* 火箭发射：向上窜出并淡出 */
.rocket-launch {
  animation: rocket-launch 0.55s cubic-bezier(0.3, 0.6, 0.4, 1) both;
}
@keyframes rocket-launch {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  60% {
    transform: translateY(-6px) scale(1.15);
    opacity: 1;
  }
  100% {
    transform: translateY(-22px) scale(0.6);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
  .rocket-launch {
    animation: none;
  }
}
</style>
