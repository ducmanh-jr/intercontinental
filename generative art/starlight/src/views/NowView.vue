<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { profile } from '@/data/profile'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import { useGsapReveal } from '@/composables/useGsapReveal'

const scopeRef = ref<HTMLElement | null>(null)
useGsapReveal(scopeRef)

// 星港终端（v2.7）：把版本历史前几条渲染成 flight log，逐行打出；
// reduced-motion 直出全部行。纯前端小动画，字符合计 <300，零开销。
const LOG_LINES = [
  '$ tail -f /var/log/starport.log',
  '[v2.6] 知识库质检完成：35 篇文章 · 30 张星图',
  '[v2.5] 阅读系统升级：漫游/翻篇/放大镜上线',
  '[v2.4] 引擎轻量化：wasm 清零，RSS 开通',
  `[now] 航向：数模备战 · deepseek harness 研究`,
  '[ok] 星港运行正常，欢迎登舰 ✦',
]
const typedLines = ref(0)
let logTimer: number | undefined
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    typedLines.value = LOG_LINES.length
    return
  }
  logTimer = window.setInterval(() => {
    typedLines.value += 1
    if (typedLines.value >= LOG_LINES.length) window.clearInterval(logTimer)
  }, 480)
})
onUnmounted(() => window.clearInterval(logTimer))

// 星港日志（v1.6）：极客文化 Now 页——此刻在做什么 / 读什么 / 学什么 / 下一步
const sections = [
  {
    key: 'doing',
    label: '正在做',
    icon: '✦',
    items: profile.now.doing,
  },
  {
    key: 'reading',
    label: '最近在读',
    icon: '❋',
    items: profile.now.reading,
  },
  {
    key: 'learning',
    label: '正在学',
    icon: '▲',
    items: profile.now.learning,
  },
  {
    key: 'next',
    label: '接下来',
    icon: '→',
    items: profile.now.next,
  },
]
</script>

<template>
  <section ref="scopeRef" class="section-container min-h-[60vh]">
    <SectionTitle over="Now" title="星港日志" as="h1" subtitle="此刻的我，正在做什么" />

    <!-- 星港终端（v2.7）：飞行日志逐行打出 -->
    <div data-reveal class="card mb-10 overflow-hidden p-0 font-mono text-xs">
      <div class="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
        <span class="h-2.5 w-2.5 rounded-full bg-[#ff5f57]"></span>
        <span class="h-2.5 w-2.5 rounded-full bg-[#febc2e]"></span>
        <span class="h-2.5 w-2.5 rounded-full bg-[#28c840]"></span>
        <span class="ml-2 text-text-muted/50">starport — flight.log</span>
      </div>
      <div class="space-y-1.5 px-5 py-4 leading-relaxed">
        <p
v-for="(line, i) in LOG_LINES.slice(0, typedLines)" :key="i"
          :class="line.startsWith('$') ? 'text-primary' : line.startsWith('[ok]') ? 'text-emerald-400/90' : line.startsWith('[now]') ? 'text-accent' : 'text-text-muted'">
          {{ line }}
        </p>
        <span v-if="typedLines < LOG_LINES.length" class="inline-block h-3.5 w-2 animate-pulse bg-primary/80 align-middle"></span>
      </div>
    </div>
    <div class="grid gap-6 md:grid-cols-2">
      <div
        v-for="sec in sections"
        :key="sec.key"
        data-reveal
        class="card group relative overflow-hidden p-6 pt-7 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-white/20"
      >
        <!-- 卡片主色顶边（v2.9）：按卡片序渐变，hover 发亮 -->
        <span
          aria-hidden="true"
          class="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-100 bg-gradient-to-r from-primary to-accent opacity-60 transition-all duration-300 group-hover:opacity-100"
        ></span>
        <p class="flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.3em] text-text-muted/70">
          <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 text-sm text-primary transition-transform duration-300 group-hover:scale-110">{{ sec.icon }}</span>
          {{ sec.label }}
        </p>
        <ul class="mt-4 space-y-3">
          <li
            v-for="item in sec.items"
            :key="item"
            class="group flex items-start gap-2.5 text-sm leading-relaxed text-text-muted transition-colors hover:text-text"
          >
            <span
              aria-hidden="true"
              class="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary/60 transition-all duration-200 group-hover:scale-150 group-hover:bg-primary"
            ></span>
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>
    </div>
    <p data-reveal class="mt-8 text-center font-mono text-xs text-text-muted/50">
      ✦ 本页灵感来自 Now 运动（nownownow.com）· 更新于 {{ profile.quickFacts.find((f) => f.label === 'UPDATED')?.value ?? '最近' }}
    </p>
  </section>
</template>
