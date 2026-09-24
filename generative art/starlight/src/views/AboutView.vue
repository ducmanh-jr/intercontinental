<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useGsapReveal } from '@/composables/useGsapReveal'
import { useCountUp } from '@/composables/useCountUp'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import FloatingBadges from '@/components/ui/FloatingBadges.vue'
import SkillNebula from '@/components/ui/SkillNebula.vue'
import ContributionStarfield from '@/components/ui/ContributionStarfield.vue'
import OjStats from '@/components/ui/OjStats.vue'
import { profile } from '@/data/profile'

const scopeRef = ref<HTMLElement | null>(null)
useGsapReveal(scopeRef)

const introParagraphs = computed(() =>
  profile.introLong
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean),
)

const BASE_URL = import.meta.env.BASE_URL

// 技能星云（v1.7）：雷达轴由技能列表归纳为六大方向，数值为自评（0-100）
const nebulaAxes = [
  { label: '算法', value: 90 },
  { label: 'Java · Python', value: 85 },
  { label: 'AI Agent', value: 88 },
  { label: '前端 Vue · TS', value: 80 },
  { label: 'C++ · 竞赛', value: 80 },
  { label: '数模 · 数竞', value: 62 },
]

const stats = ref<{ repos: number; stars: number; updatedAt: string } | null>(null)
const statsRowEl = ref<HTMLElement | null>(null)
const { values } = useCountUp(statsRowEl, () => (stats.value ? [stats.value.repos, stats.value.stars] : []))
onMounted(() => {
  fetch(`${BASE_URL}github-stats.json`)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then((v) => (stats.value = v))
})

// 标题 glitch：点击根容器加 .glitching 900ms；300ms 锁防连点；reduced-motion 不触发
const glitchRoot = ref<HTMLElement | null>(null)
let glitchTimer: number | undefined
let glitchLockedAt = 0
function triggerGlitch() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const root = glitchRoot.value
  if (!root || performance.now() - glitchLockedAt < 300) return
  glitchLockedAt = performance.now()
  if (glitchTimer !== undefined) window.clearTimeout(glitchTimer)
  root.classList.add('glitching')
  glitchTimer = window.setTimeout(() => root.classList.remove('glitching'), 900)
}
onUnmounted(() => {
  if (glitchTimer !== undefined) window.clearTimeout(glitchTimer)
})
</script>

<template>
  <section ref="scopeRef" class="section-container relative min-h-[60vh]">
    <div
      ref="glitchRoot"
      class="glitch-title cursor-pointer select-none"
      role="button"
      tabindex="0"
      aria-label="关于我：点击触发标题故障效果"
      @click="triggerGlitch"
      @keydown.enter.prevent="triggerGlitch"
      @keydown.space.prevent="triggerGlitch"
    >
      <SectionTitle over="About" title="关于我" as="h1" :subtitle="profile.title" />
    </div>
    <FloatingBadges />
    <div class="relative z-10 grid gap-10 md:grid-cols-[240px,1fr]">
      <div class="relative h-60 w-60">
        <div
          aria-hidden="true"
          class="absolute -inset-2 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-accent/20 blur-xl"
        ></div>
        <img
          :src="profile.avatar"
          :alt="profile.name"
          class="relative h-60 w-60 rounded-2xl border border-white/10 object-cover"
          loading="lazy"
        />
      </div>
      <!-- min-w-0：网格项默认 min-width:auto，内部星图 min-w-[540px] 会把轨道撑破移动端视口 -->
      <div class="min-w-0">
        <p v-for="(para, i) in introParagraphs" :key="i" data-reveal class="leading-relaxed text-text-muted">
          {{ para }}
        </p>
        <div data-reveal class="mt-10 space-y-6 border-l border-white/10 pl-6">
          <div v-for="(item, i) in profile.timeline" :key="i" class="group relative">
            <span
              aria-hidden="true"
              class="absolute -left-[30.5px] top-1.5 h-2 w-2 rounded-full border border-primary/50 bg-bg transition-all duration-200 group-hover:scale-150 group-hover:bg-primary"
            ></span>
            <div class="font-mono text-xs text-primary">{{ item.date }}</div>
            <div class="mt-1 text-base font-semibold transition-colors group-hover:text-primary">{{ item.title }}</div>
            <div class="mt-1 text-sm leading-6 text-text-muted">{{ item.desc }}</div>
          </div>
        </div>
        <div data-reveal class="mt-14">
          <SectionTitle over="Skills" title="技能星云" />
          <div class="grid items-center gap-8 md:grid-cols-[minmax(300px,360px),1fr]">
            <SkillNebula :axes="nebulaAxes" />
            <div class="space-y-4">
              <div v-for="s in profile.skills" :key="s.name" class="group">
                <div class="flex items-baseline justify-between gap-3 text-sm">
                  <span class="text-text transition-colors group-hover:text-primary">{{ s.name }}</span>
                  <span
                    class="rounded-full border px-2 py-0.5 font-mono text-[10px]"
                    :class="s.level === '熟练' ? 'border-primary/40 text-primary/80' : 'border-white/15 text-text-muted/60'"
                    >{{ s.level }}</span
                  >
                </div>
                <div class="mt-1.5 h-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                    :class="s.level === '熟练' ? 'w-[88%]' : 'w-[52%]'"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div data-reveal class="mt-8 flex gap-4">
          <a
            v-for="s in profile.socials"
            :key="s.label"
            :href="s.url"
            :target="s.url.startsWith('mailto:') ? undefined : '_blank'"
            :rel="s.url.startsWith('mailto:') ? undefined : 'noopener'"
            class="text-primary hover:underline"
          >
            {{ s.label }}
          </a>
        </div>
        <div v-if="stats" ref="statsRowEl" class="mt-10 flex gap-8 border-t border-white/10 pt-6">
          <div class="text-center">
            <p class="text-2xl font-semibold text-text">{{ values[0] ?? stats.repos }}</p>
            <p class="text-xs text-text-muted">公开仓库</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-semibold text-text">{{ values[1] ?? stats.stars }}</p>
            <p class="text-xs text-text-muted">总 Star</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-semibold text-text">{{ stats.updatedAt }}</p>
            <p class="text-xs text-text-muted">数据更新于</p>
          </div>
        </div>
        <!-- 贡献星图（v1.7）：近一年 GitHub 提交化作满天星 -->
        <div class="mt-10">
          <ContributionStarfield />
        </div>
        <!-- 算法星域（v1.7.2）：洛谷 / 牛客竞赛战绩 -->
        <div class="mt-6">
          <OjStats />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* 标题 glitch：三层叠放 = 真实 h1 文字 + ::before/::after（主题 primary/accent 双色） */
.glitch-title :deep(h1) {
  position: relative;
}

.glitch-title.glitching :deep(h1)::before,
.glitch-title.glitching :deep(h1)::after {
  /* 站点结构文案硬编码（无法在不改 SectionTitle 的情况下给 h1 注入 data-text） */
  content: '关于我';
  position: absolute;
  inset: 0;
  mix-blend-mode: screen;
  animation-iteration-count: infinite;
  animation-timing-function: steps(2, jump-none);
}

.glitch-title.glitching :deep(h1)::before {
  /* v2.16 主题变量化：glitch 双色跟随主题（落日=琥珀×玫红，极光=青绿×冰蓝） */
  color: var(--color-primary);
  animation-name: glitch-a;
  animation-duration: 90ms;
}

.glitch-title.glitching :deep(h1)::after {
  color: var(--color-accent);
  animation-name: glitch-b;
  animation-duration: 150ms;
}

/* 6 帧近似随机：translate(±4px, ±3px) 位移 + clip-path 裁切 */
@keyframes glitch-a {
  0% {
    transform: translate(4px, -3px);
    clip-path: inset(10% 0 55% 0);
  }
  16.6% {
    transform: translate(-4px, 3px);
    clip-path: inset(65% 0 12% 0);
  }
  33.3% {
    transform: translate(2px, -2px);
    clip-path: inset(30% 0 45% 0);
  }
  50% {
    transform: translate(-3px, 1px);
    clip-path: inset(75% 0 5% 0);
  }
  66.6% {
    transform: translate(4px, 3px);
    clip-path: inset(5% 0 72% 0);
  }
  83.3% {
    transform: translate(-2px, -3px);
    clip-path: inset(45% 0 25% 0);
  }
  100% {
    transform: translate(4px, -3px);
    clip-path: inset(10% 0 55% 0);
  }
}

@keyframes glitch-b {
  0% {
    transform: translate(-4px, 3px);
    clip-path: inset(55% 0 10% 0);
  }
  16.6% {
    transform: translate(3px, -1px);
    clip-path: inset(12% 0 65% 0);
  }
  33.3% {
    transform: translate(-2px, -3px);
    clip-path: inset(40% 0 30% 0);
  }
  50% {
    transform: translate(4px, 2px);
    clip-path: inset(5% 0 75% 0);
  }
  66.6% {
    transform: translate(-4px, 3px);
    clip-path: inset(70% 0 8% 0);
  }
  83.3% {
    transform: translate(1px, -2px);
    clip-path: inset(25% 0 50% 0);
  }
  100% {
    transform: translate(-4px, 3px);
    clip-path: inset(55% 0 10% 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .glitch-title.glitching :deep(h1)::before,
  .glitch-title.glitching :deep(h1)::after {
    animation: none;
    content: none;
  }
}
</style>
