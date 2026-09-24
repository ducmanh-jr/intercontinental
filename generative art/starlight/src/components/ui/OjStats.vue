<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ojStats, type OjPlatformStats } from '@/data/oj'

// 算法星域（v1.7.2）：洛谷/牛客竞赛战绩卡。
// 数据优先级：构建脚本生成的 public/oj-stats.json > src/data/oj.ts 手填值；拉不到的显示 —。
const BASE_URL = import.meta.env.BASE_URL
const fetched = ref<{ luogu: { passed: number | null; submitted: number | null; rating: number | null }; updatedAt: string } | null>(null)

onMounted(() => {
  fetch(`${BASE_URL}oj-stats.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((v) => {
      if (v && v.luogu) fetched.value = v
    })
    .catch(() => {
      /* 静默回退到手填数据 */
    })
})

const display = (p: OjPlatformStats): OjPlatformStats => {
  if (p.name === '洛谷' && fetched.value) {
    return { ...p, ...fetched.value.luogu }
  }
  return p
}
const fmt = (n: number | null | undefined) => (n == null ? '—' : String(n))
</script>

<template>
  <div data-reveal class="card p-6">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <p class="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-text-muted/70">
        <span class="text-primary" aria-hidden="true">◈</span>
        算法星域 · OJ Battlefield
      </p>
      <p v-if="fetched" class="font-mono text-xs text-text-muted/60">数据更新于 {{ fetched.updatedAt }}</p>
    </div>
    <div class="mt-5 grid gap-4 sm:grid-cols-2">
      <a
        v-for="raw in ojStats"
        :key="raw.name"
        :href="raw.url"
        target="_blank"
        rel="noopener"
        class="group rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40"
      >
        <div class="flex items-center gap-2.5">
          <span class="text-lg text-primary transition-transform duration-300 group-hover:scale-125" aria-hidden="true">{{ raw.mark }}</span>
          <span class="font-semibold transition-colors group-hover:text-primary">{{ raw.name }}</span>
          <span
            aria-hidden="true"
            class="ml-auto text-text-muted/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
            >↗</span
          >
        </div>
        <dl class="mt-3 grid grid-cols-3 gap-2 text-center">
          <div class="rounded-lg bg-white/[0.03] py-2">
            <dt class="text-[10px] text-text-muted/60">通过题</dt>
            <dd class="mt-0.5 font-mono text-base font-semibold tabular-nums text-primary">{{ fmt(display(raw).passed) }}</dd>
          </div>
          <div class="rounded-lg bg-white/[0.03] py-2">
            <dt class="text-[10px] text-text-muted/60">提交数</dt>
            <dd class="mt-0.5 font-mono text-base font-semibold tabular-nums text-text">{{ fmt(display(raw).submitted) }}</dd>
          </div>
          <div class="rounded-lg bg-white/[0.03] py-2">
            <dt class="text-[10px] text-text-muted/60">Rating</dt>
            <dd class="mt-0.5 font-mono text-base font-semibold tabular-nums text-accent">{{ fmt(display(raw).rating) }}</dd>
          </div>
        </dl>
        <p v-if="raw.extra" class="mt-3 font-mono text-[11px] text-text-muted/70">
          <span class="text-text-muted/50">{{ raw.extra.label }}：</span>{{ raw.extra.value }}
        </p>
      </a>
    </div>
    <p class="mt-4 font-mono text-[10px] leading-5 text-text-muted/40">
      ◈ 通过题/提交数/Rating 支持自动同步：CI 配置 LUOGU_UID 后构建时拉取，或直接编辑 src/data/oj.ts
    </p>
  </div>
</template>
