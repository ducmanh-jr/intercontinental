<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { projects } from '@/data/projects'
import ProjectCard from '@/components/ui/ProjectCard.vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import { useGsapReveal } from '@/composables/useGsapReveal'

const scopeRef = ref<HTMLElement | null>(null)
useGsapReveal(scopeRef)

// v1.7 星轨巡航：原生横向滚动替代 v1.4 的 GSAP pin 方案——
// pin 的横移距离公式脆弱（v1.5/v1.5.1 修了两次仍有末卡遮挡）且 pin spacer 残留会干扰页高。
// 这里用 overflow-x + scroll-snap：末卡永远完整可见，触摸板/拖拽/键盘/按钮全兼容。
const scrollerRef = ref<HTMLElement | null>(null)

const progress = ref(0)
const activeIdx = computed(() => Math.round(progress.value * (projects.length - 1)))

// 卡顿修复（v1.11）：强制 snap 与直接写 scrollLeft 会互相拉扯；交互期间解除 snap，
// 停手 220ms 后恢复，浏览器自动吸附到最近卡片。拖拽中同时关闭卡片 hover/倾斜效果。
const freeScroll = ref(false)
let freeTimer: number | undefined
function engageFreeScroll(ms = 220) {
  freeScroll.value = true
  window.clearTimeout(freeTimer)
  freeTimer = window.setTimeout(() => (freeScroll.value = false), ms)
}

function onRailScroll() {
  const el = scrollerRef.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  progress.value = max > 0 ? el.scrollLeft / max : 0
}

// v2.10：移除滚轮竖转横——轨道横贯页面中部，劫持会让「页面向下滚」变成
// 「轨道向右滚」，用户感知为下滑卡死。横向浏览交给按钮/拖拽/方向键/触摸板原生横滚。

// 鼠标拖拽巡航（触摸设备走原生滚动）。
// 事件体系：mousedown 后挂 window 级 mousemove/mouseup——不依赖 pointer capture（其会劫持
// click，也不能在合成指针下使用），拖出轨道范围依然跟手；位移 >6px 才算拖拽，纯点击不受影响。
let dragging = false
let dragArmed = false
let dragBaseX = 0
let dragBaseScroll = 0
let dragMoved = 0
function onRailMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
  if (!scrollerRef.value) return
  // 掐断原生拖拽/选区启动（img ghost 拖图会吃掉 mousemove）；不影响链接 click
  e.preventDefault()
  dragArmed = true
  dragMoved = 0
  dragBaseX = e.clientX
  dragBaseScroll = scrollerRef.value.scrollLeft
  window.addEventListener('mousemove', onRailMouseMove)
  window.addEventListener('mouseup', onRailMouseUp)
}
function onRailMouseMove(e: MouseEvent) {
  if (!dragArmed) return
  const el = scrollerRef.value
  if (!el) return
  const dx = e.clientX - dragBaseX
  if (!dragging) {
    if (Math.abs(dx) < 6) return // 未过阈值：保留原生点击与 hover
    dragging = true
    dragBaseX = e.clientX
    dragBaseScroll = el.scrollLeft
    dragMoved = 0
    window.clearTimeout(freeTimer)
    freeScroll.value = true
  }
  const step = e.clientX - dragBaseX
  dragMoved = Math.max(dragMoved, Math.abs(step))
  el.scrollLeft = dragBaseScroll - step
}
function onRailMouseUp() {
  window.removeEventListener('mousemove', onRailMouseMove)
  window.removeEventListener('mouseup', onRailMouseUp)
  dragArmed = false
  if (!dragging) return
  dragging = false
  engageFreeScroll(260) // 松手后恢复 snap 类型，浏览器吸附到最近卡片
}
onUnmounted(() => {
  window.removeEventListener('mousemove', onRailMouseMove)
  window.removeEventListener('mouseup', onRailMouseUp)
})
// 拖拽释放后的 click 落在卡片链接上时吞掉，避免「拖完误跳转」
function onRailClickCapture(e: MouseEvent) {
  if (dragMoved > 8) {
    e.preventDefault()
    e.stopPropagation()
  }
  dragMoved = 0
}

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function scrollRail(dir: 1 | -1) {
  const el = scrollerRef.value
  if (!el) return
  const card = el.querySelector<HTMLElement>('[data-card]')
  const step = card ? card.offsetWidth + 32 : 452 // 420px 卡宽 + gap-8
  el.scrollBy({ left: dir * step, behavior: prefersReduced() ? 'auto' : 'smooth' })
}
function onRailKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    scrollRail(1)
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    scrollRail(-1)
  }
}

onUnmounted(() => {
  window.clearTimeout(freeTimer)
})
</script>

<template>
  <section ref="scopeRef" class="relative min-h-[60vh] overflow-hidden py-20">
    <div class="section-container !py-0">
      <SectionTitle over="Projects" title="项目星轨" as="h1" subtitle="每一颗星都是一个能跑的作品——拖拽巡航，或用方向键逐舰检阅" />
    </div>
    <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-20 z-0 overflow-hidden [contain:strict]">
      <div class="marquee-track flex whitespace-nowrap">
        <span class="marquee-item font-mono text-8xl font-bold leading-none text-transparent" style="-webkit-text-stroke: 1px color-mix(in oklab, var(--color-accent) 16%, transparent)">PROJECTS // 星轨巡航&nbsp;&nbsp;</span>
        <span class="marquee-item font-mono text-8xl font-bold leading-none text-transparent" style="-webkit-text-stroke: 1px color-mix(in oklab, var(--color-accent) 16%, transparent)">PROJECTS // 星轨巡航&nbsp;&nbsp;</span>
      </div>
    </div>

    <!-- 星轨巡航：拖拽 / 滚轮 / 方向键 / 触摸滑动均可，scroll-snap 保证停稳在卡片上 -->
    <div
      ref="scrollerRef"
      class="rail-scroll rail-pad relative z-10 mt-12 flex snap-x snap-mandatory select-none gap-8 overflow-x-auto px-6 pb-4 pt-2"
      :class="{ 'rail-free': freeScroll }"
      tabindex="0"
      role="region"
      aria-label="项目横向列表：可拖拽或使用左右方向键浏览"
      @scroll.passive="onRailScroll"
      @mousedown="onRailMouseDown"
      @click.capture="onRailClickCapture"
      @keydown="onRailKeydown"
    >
      <div
        v-for="p in projects"
        :key="p.slug"
        data-card
        class="w-[420px] max-w-[85vw] shrink-0 snap-center"
      >
        <ProjectCard :project="p" />
      </div>
      <!-- 末端航标：滚动尽头的「抵达」提示 -->
      <div aria-hidden="true" class="w-4 shrink-0 snap-none"></div>
    </div>

    <!-- 星轨进度：轨道线 + 亮星指示当前卡片 + 手动巡航按钮 -->
    <div class="section-container !py-0">
      <div data-reveal class="mt-6 flex items-center gap-6">
        <button
          type="button"
          class="group flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-text-muted transition-all hover:border-primary/50 hover:text-primary"
          aria-label="上一张项目卡"
          @click="scrollRail(-1)"
        >
          <span class="transition-transform group-hover:-translate-x-0.5">←</span>
        </button>
        <div class="relative flex-1">
          <div class="h-px w-full bg-white/10"></div>
          <div
            class="absolute left-0 top-0 h-px bg-gradient-to-r from-primary to-accent transition-[width] duration-200"
            :style="{ width: progress * 100 + '%' }"
          ></div>
          <span
            v-for="(p, i) in projects"
            :key="p.slug"
            class="absolute top-1/2 -translate-y-1/2 transition-all duration-300"
            :style="{ left: `calc(${(i / (projects.length - 1)) * 100}% - 6px)` }"
            :title="p.title"
          >
            <span
              class="block h-3 w-3 rotate-45 rounded-[2px] border transition-all duration-300"
              :class="
                i === activeIdx
                  ? 'border-primary bg-primary shadow-[0_0_10px_rgba(34,211,238,0.8)]'
                  : i < activeIdx
                    ? 'border-primary/40 bg-primary/20'
                    : 'border-white/20 bg-bg'
              "
            ></span>
          </span>
        </div>
        <button
          type="button"
          class="group flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-text-muted transition-all hover:border-primary/50 hover:text-primary"
          aria-label="下一张项目卡"
          @click="scrollRail(1)"
        >
          <span class="transition-transform group-hover:translate-x-0.5">→</span>
        </button>
        <span class="shrink-0 font-mono text-xs tabular-nums text-text-muted/70">
          <span class="text-primary">{{ String(activeIdx + 1).padStart(2, '0') }}</span>
          <span class="mx-1 text-white/20">/</span>
          {{ String(projects.length).padStart(2, '0') }}
        </span>
      </div>
      <p class="mt-4 font-mono text-xs tracking-[0.3em] text-text-muted/50">拖拽 · 滚轮 · ← → 方向键巡航</p>
    </div>
  </section>
</template>

<style scoped>
/* 性能（v2.9）：巨型描边字横移在滚动时常驻重绘——提升为合成层并锁定 paint，
   页面纵向滚动不再随帧重绘 marquee；40s 匀速循环视觉不变 */
.marquee-track {
  animation: marquee 40s linear infinite;
  width: max-content;
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}

@keyframes marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

/* 交互期间：解除强制吸附 */
.rail-scroll.rail-free {
  scroll-snap-type: none;
}
/* 禁止封面图原生拖拽：img 上的 mousedown 会触发浏览器 ghost 拖图，吃掉 mousemove（拖不动/卡顿主因） */
.rail-scroll :deep(img) {
  -webkit-user-drag: none;
  user-select: none;
}
.rail-scroll :deep(a) {
  -webkit-user-drag: none;
}
/* 卡顿修复：轨道卡片用实底背景（backdrop-blur 在滚动时是合成大开销），
   且拖拽/滚轮期间关闭 hover 浮起、光晕阴影与磁吸倾斜的重绘 */
.rail-scroll :deep(.card) {
  backdrop-filter: none;
  background: var(--color-surface);
}
.rail-free :deep(.card),
.rail-free :deep(.card:hover) {
  transform: none !important;
  box-shadow: none !important;
  border-color: rgba(255, 255, 255, 0.1);
}
html[data-theme='paper'] .rail-free :deep(.card:hover),
html[data-theme='sakura'] .rail-free :deep(.card:hover) {
  border-color: color-mix(in oklab, var(--color-text) 14%, transparent);
}

/* 桌面端：轨道左右留白对齐 max-w-5xl 容器边缘，卡片起点与标题齐平 */
@media (min-width: 768px) {
  .rail-pad {
    padding-left: max(1.5rem, calc((100vw - 64rem) / 2));
    padding-right: max(1.5rem, calc((100vw - 64rem) / 2));
  }
}

/* 隐藏横向轨道滚动条（页面级滚动条保留全局样式） */
.rail-scroll {
  scrollbar-width: none;
  overscroll-behavior-x: contain;
  cursor: grab;
}
.rail-scroll:active {
  cursor: grabbing;
}
.rail-scroll::-webkit-scrollbar {
  display: none;
}
/* 两端轻微渐隐，暗示轨道延伸（mask 不遮挡交互） */
.rail-scroll {
  -webkit-mask-image: linear-gradient(
    90deg,
    transparent 0,
    #000 48px,
    #000 calc(100% - 48px),
    transparent 100%
  );
  mask-image: linear-gradient(
    90deg,
    transparent 0,
    #000 48px,
    #000 calc(100% - 48px),
    transparent 100%
  );
}

@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none;
  }
}
</style>
