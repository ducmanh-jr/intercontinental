<script setup lang="ts">
import { computed } from 'vue'
import { listPostMetas, blogMetas } from '@/lib/blog'

// 今日一题（v2.6）：按本地日期确定性轮换——同一天所有访客看到同一题，
// 算法文库里难度>0 的篇目做简单 hash 挑选。零后端、零随机跳变。
const algoPosts = computed(() =>
  listPostMetas(blogMetas).filter((p) => p.difficulty > 0),
)

// FNV-1a：短小、分布均匀，够日常轮换用
function fnv1a(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

const today = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const pick = computed(() => {
  const pool = algoPosts.value
  if (!pool.length) return null
  return pool[fnv1a(today.value) % pool.length]
})

const pickTags = computed(() => {
  const p = pick.value
  return p ? p.tags.filter((t) => t !== p.category).slice(0, 3).map((t) => `#${t}`).join(' ') : ''
})
</script>

<template>
  <div v-if="pick" data-reveal class="card group relative overflow-hidden p-6">
    <!-- 右上角装饰：今日日期 -->
    <span class="absolute right-4 top-4 font-mono text-[10px] text-text-muted/40">{{ today }}</span>
    <p class="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-text-muted/70">
      <span class="animate-pulse text-accent" aria-hidden="true">✦</span>
      今日一题 · Daily Problem
    </p>
    <RouterLink :to="`/blog/${pick.slug}`" class="mt-3 block">
      <p class="text-lg font-semibold leading-snug transition-colors group-hover:text-primary">
        {{ pick.title }}
      </p>
      <p class="mt-2 line-clamp-2 text-sm leading-6 text-text-muted">{{ pick.desc }}</p>
      <p class="mt-3 flex items-center gap-3 font-mono text-xs text-text-muted/60">
        <span v-if="pick.difficulty" class="leading-none">
          <span class="text-accent/90">{{ '★'.repeat(pick.difficulty) }}</span><span class="text-white/15">{{ '★'.repeat(5 - pick.difficulty) }}</span>
        </span>
        <span>{{ pickTags }}</span>
        <span class="ml-auto shrink-0 text-primary opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100">去挑战 →</span>
      </p>
    </RouterLink>
  </div>
</template>
