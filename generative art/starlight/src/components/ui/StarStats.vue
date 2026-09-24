<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { projects } from '@/data/projects'
import { listPostMetas, blogMetas } from '@/lib/blog'
import { useCountUp } from '@/composables/useCountUp'

// 星光统计带（v1.6）：项目/文章/GitHub 数据带滚动计数；github-stats 失败时静默降级为本地数据
const BASE_URL = import.meta.env.BASE_URL
const postCount = listPostMetas(blogMetas).length
const stats = ref<{ repos: number; stars: number } | null>(null)
const rowEl = ref<HTMLElement | null>(null)
const { values } = useCountUp(rowEl, () => [
  projects.length,
  postCount,
  stats.value?.repos ?? 0,
  stats.value?.stars ?? 0,
])

onMounted(() => {
  fetch(`${BASE_URL}github-stats.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((v) => {
      if (v && typeof v.repos === 'number') stats.value = v
    })
    .catch(() => {
      /* 统计不可用时静默降级（本地数据仍展示） */
    })
})

// 星港时钟（UTC+8），每秒刷新
const now = ref(new Date())
let timer = 0
const timeText = () =>
  now.value.toLocaleTimeString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })
const dateText = () =>
  now.value.toLocaleDateString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
onMounted(() => {
  timer = window.setInterval(() => (now.value = new Date()), 1000)
})
onUnmounted(() => window.clearInterval(timer))
</script>

<template>
  <div class="mt-20">
    <div ref="rowEl" class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div data-reveal class="card p-5 text-center">
        <p class="text-2xl font-semibold tabular-nums text-primary">{{ values[0] ?? projects.length }}</p>
        <p class="mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-text-muted/70">项目</p>
      </div>
      <div data-reveal class="card p-5 text-center">
        <p class="text-2xl font-semibold tabular-nums text-primary">{{ values[1] ?? postCount }}</p>
        <p class="mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-text-muted/70">文章</p>
      </div>
      <div data-reveal class="card p-5 text-center">
        <p class="text-2xl font-semibold tabular-nums text-primary">{{ values[2] ?? stats?.repos ?? '—' }}</p>
        <p class="mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-text-muted/70">公开仓库</p>
      </div>
      <div data-reveal class="card p-5 text-center">
        <p class="text-2xl font-semibold tabular-nums text-primary">{{ values[3] ?? stats?.stars ?? '—' }}</p>
        <p class="mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-text-muted/70">总 Star</p>
      </div>
    </div>
    <!-- 星港时钟：UTC+8 实时 -->
    <div data-reveal class="mt-4 flex items-center justify-center gap-2 font-mono text-xs text-text-muted/60">
      <span class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary/70" aria-hidden="true"></span>
      <span>星港时间</span>
      <span class="tabular-nums text-text-muted">{{ dateText() }} · {{ timeText() }} · UTC+8</span>
    </div>
  </div>
</template>
