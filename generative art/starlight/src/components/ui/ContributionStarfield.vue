<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

// 贡献星图（v1.7）：构建期由 scripts/fetch-github-stats.mjs 生成 public/github-contributions.json，
// 近一年 364 天按 52 周 × 7 天排成星图——贡献越多星星越大越亮；数据缺失时整块隐藏。
interface Day {
  date: string
  count: number
}
interface Contributions {
  total: number
  updatedAt: string
  days: Day[]
}

const BASE_URL = import.meta.env.BASE_URL
const data = ref<Contributions | null>(null)

onMounted(() => {
  fetch(`${BASE_URL}github-contributions.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((v) => {
      if (v && Array.isArray(v.days) && v.days.length > 0) data.value = v
    })
    .catch(() => {
      /* 数据不可用时整块隐藏 */
    })
})

// 亮度分级：0 隐星 → 4 最亮（闪烁）
function levelOf(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 9) return 3
  return 4
}
const levelClass = ['lvl-0', 'lvl-1', 'lvl-2', 'lvl-3', 'lvl-4'] as const

const streak = computed(() => {
  const days = data.value?.days ?? []
  let best = 0
  let cur = 0
  for (const d of days) {
    cur = d.count > 0 ? cur + 1 : 0
    best = Math.max(best, cur)
  }
  return best
})
</script>

<template>
  <div v-if="data" data-reveal class="card p-6">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <p class="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-text-muted/70">
        <span class="text-primary" aria-hidden="true">✦</span>
        贡献星图 · Contribution Sky
      </p>
      <p class="font-mono text-xs text-text-muted/60">
        近一年 <span class="text-primary">{{ data.total }}</span> 次提交 · 最长连续
        <span class="text-primary">{{ streak }}</span> 天 · {{ data.updatedAt }}
      </p>
    </div>
    <div class="mt-5 overflow-x-auto pb-1">
      <!-- 52 列 × 7 行：grid-flow-col 按「先列后行」自动排布，与 GitHub 热力图同构 -->
      <div class="sky-grid min-w-[540px]">
        <span
          v-for="(d, i) in data.days"
          :key="d.date"
          class="star"
          :class="[levelClass[levelOf(d.count)], { twinkle: levelOf(d.count) >= 3 }]"
          :style="{ animationDelay: (i % 13) * 0.35 + 's' }"
          :title="`${d.date} · ${d.count} 次提交`"
          ><i></i
        ></span>
      </div>
    </div>
    <div class="mt-4 flex items-center justify-end gap-1.5 font-mono text-[10px] text-text-muted/50">
      <span>少</span>
      <span class="star lvl-0"><i></i></span>
      <span class="star lvl-1"><i></i></span>
      <span class="star lvl-2"><i></i></span>
      <span class="star lvl-3"><i></i></span>
      <span class="star lvl-4"><i></i></span>
      <span>多</span>
    </div>
  </div>
</template>

<style scoped>
.sky-grid {
  display: grid;
  grid-template-rows: repeat(7, 12px);
  grid-auto-flow: column;
  grid-auto-columns: 12px;
  gap: 3px;
}
/* 外层 span 是 12px 网格单元；内层 i 是四角星本体，按亮度放大点亮 */
.star {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
}
.star i {
  display: block;
  width: 12px;
  height: 12px;
  background: rgba(255, 255, 255, 0.12);
  transform: scale(0.35);
  transition: transform 0.2s ease;
  /* 内层 i 是四角星本体：clip-path 裁形，背景色/缩放随亮度类切换 */
  clip-path: polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%);
}
.lvl-0 i {
  border-radius: 50%;
  clip-path: none;
  width: 3px;
  height: 3px;
  background: rgba(255, 255, 255, 0.12);
}
.lvl-1 i {
  background: color-mix(in oklab, var(--color-primary) 45%, transparent);
  transform: scale(0.55);
}
.lvl-2 i {
  background: color-mix(in oklab, var(--color-primary) 75%, transparent);
  transform: scale(0.75);
}
.lvl-3 i {
  background: var(--color-primary);
  transform: scale(0.95);
}
.lvl-4 i {
  background: var(--color-accent);
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.9);
  transform: scale(1.1);
}
@media (prefers-reduced-motion: reduce) {
  .star.twinkle {
    animation: none;
  }
}
</style>
