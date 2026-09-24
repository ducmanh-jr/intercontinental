<script setup lang="ts">
import { ref } from 'vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import { useGsapReveal } from '@/composables/useGsapReveal'
import { versions } from '@/data/versions'

// 版本历史属站点元信息（发版时手动维护，最新版本置顶；同步更新 index.html footer 的版本号链接）

const scopeRef = ref<HTMLElement | null>(null)

// 版本星座（v2.7）：版本沿正弦轨迹排布成一条「星轨」，越新越亮越大；
// hover 显示版本号，点击平滑滚动到下方时间线对应条目
const constellation = versions.map((item, i) => {
  const n = versions.length
  const t = n === 1 ? 0 : i / (n - 1)
  return {
    ...item,
    idx: i,
    x: 40 + t * 560,
    y: 130 + Math.sin(t * Math.PI * 2.2) * 62,
    r: 2.5 + (1 - i / Math.max(1, n - 1)) * 3.2,
    bright: 1 - i / Math.max(1, n) / 1.4,
  }
})
const constellationPath = constellation
  .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
  .join(' ')
const hoverStar = ref<number | null>(null)
function scrollToVersion(i: number) {
  document.getElementById(`ver-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
useGsapReveal(scopeRef)
</script>

<template>
  <section ref="scopeRef" class="section-container relative min-h-[60vh]">
    <SectionTitle over="Star Map" title="版本星图" as="h1" />
    <!-- 版本星座（v2.7）：一条星轨串起所有版本，最新最亮；点击星定位到下方详情 -->
    <svg
      data-reveal
      viewBox="0 0 640 260"
      class="mb-14 w-full select-none"
      role="img"
      :aria-label="`版本星座图：从 ${versions[versions.length - 1]?.v ?? 'v1.0.0'} 到 ${versions[0]?.v ?? ''} 的星轨`"
    >
      <!-- 星轨连线 -->
      <path
        :d="constellationPath"
        fill="none"
        stroke="rgba(255,255,255,0.10)"
        stroke-width="1.2"
        stroke-dasharray="3 4"
      />
      <!-- 版本星 -->
      <g
        v-for="c in constellation"
        :key="c.v"
        class="cursor-pointer"
        @click="scrollToVersion(c.idx)"
        @mouseenter="hoverStar = c.idx"
        @mouseleave="hoverStar = null"
      >
        <circle
          :cx="c.x"
          :cy="c.y"
          :r="c.r + (hoverStar === c.idx ? 2.5 : 0)"
          class="transition-all duration-200"
          :fill="c.idx === 0 ? 'var(--color-primary)' : '#e2e8f0'"
          :opacity="0.35 + c.bright * 0.6"
        />
        <!-- 光晕：最新的几颗 -->
        <circle
          v-if="c.idx < 3"
          :cx="c.x"
          :cy="c.y"
          :r="c.r + 5"
          fill="none"
          :stroke="c.idx === 0 ? 'var(--color-primary)' : '#a5b4fc'"
          :opacity="0.4 - c.idx * 0.1"
          stroke-width="1"
        />
        <!-- 版本号标签：首尾与 hover 显示，避免 21 颗全标糊成一团 -->
        <text
          v-if="c.idx === 0 || c.idx === versions.length - 1 || hoverStar === c.idx"
          :x="c.x"
          :y="c.y - c.r - 7"
          text-anchor="middle"
          class="fill-text-muted font-mono"
          font-size="11"
        >
          {{ c.v }}
        </text>
      </g>
    </svg>
    <!-- 垂直时间线：复用关于页样式（border-l + pl-6），节点圆点挂在细线上 -->
    <div data-reveal class="relative z-10 space-y-8 border-l border-white/10 pl-6">
      <div
        v-for="(item, i) in versions"
        :id="`ver-${i}`"
        :key="item.v"
        class="group relative scroll-mt-28"
      >
        <span
          aria-hidden="true"
          class="absolute -left-[29px] top-1.5 h-2 w-2 rounded-full transition-all duration-200 group-hover:scale-150"
          :class="
            i === 0
              ? 'bg-primary shadow-[0_0_8px_rgba(34,211,238,0.8)]'
              : 'bg-white/20 group-hover:bg-primary/60'
          "
        ></span>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span class="font-mono text-primary transition-colors group-hover:text-accent">{{
            item.v
          }}</span>
          <span class="font-mono text-xs text-text-muted">{{ item.date }}</span>
          <span
            v-if="i === 0"
            class="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] tracking-widest text-primary"
            >● NOW</span
          >
        </div>
        <p class="mt-1.5 text-sm leading-6 text-text-muted">{{ item.note }}</p>
      </div>
    </div>
  </section>
</template>
