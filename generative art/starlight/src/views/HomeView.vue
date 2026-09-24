<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { profile } from '@/data/profile'
import { projects } from '@/data/projects'
import { listPostMetas, blogMetas } from '@/lib/blog'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import ElasticHeading from '@/components/ui/ElasticHeading.vue'
import OrbitText from '@/components/ui/OrbitText.vue'
import StarStats from '@/components/ui/StarStats.vue'
import DailyProblem from '@/components/ui/DailyProblem.vue'
import { useGsapReveal } from '@/composables/useGsapReveal'
import { useTypewriter } from '@/composables/useTypewriter'

const heroRef = ref<HTMLElement | null>(null)
const hintRef = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null
let hintHidden = false
function onHintScroll() {
  const hide = window.scrollY > 80
  if (hide !== hintHidden) {
    hintHidden = hide
    hintRef.value?.classList.toggle('scroll-hint-hidden', hide)
  }
}

const featuredProjects = projects.filter((p) => p.featured).slice(0, 4)
const latestPosts = listPostMetas(blogMetas).slice(0, 3)

const { text: typed } = useTypewriter(profile.typedPhrases)

// 星港问候（v1.7）：按访客本地时间切换的问候语
const greetingByHour = () => {
  const h = new Date().getHours()
  if (h < 5) return '夜深了，星港仍在值守 ✦'
  if (h < 11) return '早上好，新航次即将出发 ✦'
  if (h < 14) return '午安，来杯恒星咖啡 ☕'
  if (h < 18) return '下午好，航道畅通 ✦'
  if (h < 23) return '晚上好，今晚星光很亮 ✦'
  return '夜深了，愿代码与你同眠 ✦'
}
const greeting = greetingByHour()

// 打字区用最长短语做不可见占位（绝对定位真实文本），打字过程不改变布局（防 CLS）
const typedPhrasesMax = [...profile.typedPhrases].sort((a, b) => b.length - a.length)[0]

const scopeRef = ref<HTMLElement | null>(null)
useGsapReveal(scopeRef)

// hero 视差（v2.7）：光标位移写入 CSS 变量，标题/轨道装饰反向微移；
// rAF 节流 + 指针离开回中。reduced-motion 与触屏不启用。
let heroRaf = 0
function onHeroMouseMove(e: MouseEvent) {
  if (!heroRef.value) return
  if (heroRaf) return
  heroRaf = requestAnimationFrame(() => {
    heroRaf = 0
    const el = heroRef.value
    if (!el) return
    el.style.setProperty('--hx', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3))
    el.style.setProperty('--hy', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3))
  })
}
function onHeroPointerLeave() {
  heroRef.value?.style.setProperty('--hx', '0')
  heroRef.value?.style.setProperty('--hy', '0')
}

onMounted(() => {
  window.addEventListener('scroll', onHintScroll, { passive: true })
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('mousemove', onHeroMouseMove, { passive: true })
    document.addEventListener('pointerleave', onHeroPointerLeave)
  }
  if (!heroRef.value) return
  // reduced-motion：跳过入场动画，hero 保持可见终态（ctx 为 null，onUnmounted 的 ctx?.revert() 安全）
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  void (async () => {
    const gsap = (await import('gsap')).default
    if (!heroRef.value) return // await 期间组件卸载
    ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } })
      tl.from('.hero-title', { y: 50, opacity: 0 })
        .from('.hero-motto', { y: 20, opacity: 0 }, '-=0.7')
        .from('.hero-subtitle', { y: 30, opacity: 0 }, '-=0.7')
        .from('.hero-cta', { y: 20, opacity: 0 }, '-=0.7')
    }, heroRef.value)
  })()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onHintScroll)
  window.removeEventListener('mousemove', onHeroMouseMove)
  document.removeEventListener('pointerleave', onHeroPointerLeave)
  if (heroRaf) cancelAnimationFrame(heroRaf)
  ctx?.revert()
})
</script>

<template>
  <div>
    <section ref="heroRef" class="hero-parallax section-container relative flex min-h-screen flex-col justify-center">
      <!-- 旋转轨道文字：hero 右下装饰（仅 md 以上） -->
      <div class="hero-orbit absolute bottom-24 right-10 hidden md:block">
        <OrbitText text="STARLIGHT ✦ PORTFOLIO ✦ CODING AMONG THE STARS ✦ " />
      </div>
      <p class="hero-subtitle font-mono text-sm text-primary">
        {{ profile.title }}
      </p>
      <h1 class="hero-title mt-4 text-5xl font-bold leading-tight md:text-7xl">
        <svg viewBox="0 0 420 110" class="h-auto w-full max-w-xl" role="img" :aria-label="profile.name">
          <text x="4" y="78" class="svg-name" fill="url(#nameGrad)" stroke="url(#nameGrad)" stroke-width="1.5">
            {{ profile.name }}
          </text>
          <defs>
            <linearGradient id="nameGrad" x1="0" y1="0" x2="1" y2="0">
              <!-- v2.16 主题变量化：hero 名字渐变随主题（stop-color 走 CSS 变量） -->
              <stop offset="0" style="stop-color: var(--color-primary)" />
              <stop offset="1" style="stop-color: var(--color-accent)" />
            </linearGradient>
          </defs>
        </svg>
      </h1>
      <p class="hero-motto mt-3 font-mono text-sm text-primary/70">
        {{ profile.motto }}
      </p>
      <p class="hero-subtitle mt-1.5 font-mono text-xs tracking-[0.2em] text-text-muted/60">
        {{ greeting }}
      </p>
      <p class="hero-subtitle mt-6 max-w-xl text-base text-text-muted md:text-lg">
        {{ profile.introShort }}
        <span class="relative inline-block whitespace-nowrap align-baseline">
          <span class="invisible">{{ typedPhrasesMax }}</span>
          <span class="absolute left-0 top-0 whitespace-nowrap text-primary"
            >{{ typed }}<span class="hero-caret" aria-hidden="true">▍</span></span
          >
        </span>
      </p>
      <ElasticHeading
        class="hero-cta mt-8 text-xl text-text-muted md:text-2xl"
        text="代码 · 算法 · 星空 —— 记录每一次航行"
      />
      <p class="hero-cta mt-3 font-serif text-sm italic text-text-muted/70">coding among the stars ✦</p>
      <div class="hero-cta mt-10 flex gap-4">
        <RouterLink to="/projects" class="btn-primary">看看项目</RouterLink>
        <RouterLink
          to="/about"
          class="inline-flex items-center rounded-lg border border-white/10 px-6 py-3 text-sm transition-colors hover:border-white/30"
        >
          关于我
        </RouterLink>
      </div>
      <dl class="hero-cta mt-12 max-w-md">
        <div
          v-for="f in profile.quickFacts"
          :key="f.label"
          class="flex items-baseline justify-between gap-6 border-b border-white/10 py-1.5"
        >
          <dt class="font-mono text-xs tracking-[0.25em] text-text-muted/70">{{ f.label }}</dt>
          <dd class="text-sm text-text">{{ f.value }}</dd>
        </div>
      </dl>
      <!-- 滚动指示器：首屏底部缓动下落箭头，滚动后淡出（v1.5 设计增强） -->
      <div
        ref="hintRef"
        class="scroll-hint absolute bottom-8 left-1/2 -translate-x-1/2"
        aria-hidden="true"
      >
        <div class="flex h-9 w-5 items-start justify-center rounded-full border border-white/15 pt-1.5">
          <span class="scroll-hint-dot h-1.5 w-1 rounded-full bg-primary/80"></span>
        </div>
      </div>
    </section>

    <div ref="scopeRef">
      <section class="section-container py-14">
        <SectionTitle over="Featured Work" title="精选项目" subtitle="从星港船坞驶出的三艘舰船" />
        <ul class="flex flex-col divide-y divide-white/5">
          <li v-for="p in featuredProjects" :key="p.slug" data-reveal>
            <a
              :href="p.github"
              target="_blank"
              rel="noopener"
              class="group -mx-3 flex items-baseline justify-between gap-6 rounded-lg px-3 py-4 transition-all duration-200 hover:bg-white/[0.03]"
            >
              <span>
                <span class="font-semibold text-text transition-colors group-hover:text-primary">{{ p.title }}</span>
                <span class="ml-3 text-sm text-text-muted">{{ p.description.slice(0, 42) }}{{ p.description.length > 42 ? '…' : '' }}</span>
              </span>
              <span class="shrink-0 font-mono text-xs text-text-muted transition-transform duration-200 group-hover:translate-x-1">GitHub →</span>
            </a>
          </li>
        </ul>
        <RouterLink to="/projects" data-reveal class="group mt-6 inline-flex items-center gap-1 text-sm text-primary">
          <span class="transition-colors group-hover:text-accent">查看全部项目</span>
          <span class="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </RouterLink>
      </section>

      <!-- 今日一题（v2.6）：按日期确定性轮换 -->
      <section class="section-container py-8">
        <DailyProblem />
      </section>

      <section class="section-container py-14">
        <SectionTitle over="From The Blog" title="最新文章" subtitle="算法复盘与建站实录，持续广播中" />
        <ul class="flex flex-col divide-y divide-white/5">
          <li v-for="post in latestPosts" :key="post.slug" data-reveal>
            <RouterLink
              :to="`/blog/${post.slug}`"
              class="group -mx-3 flex items-baseline justify-between gap-6 rounded-lg px-3 py-4 transition-all duration-200 hover:bg-white/[0.03]"
            >
              <span class="font-semibold text-text transition-colors group-hover:text-primary">{{ post.title }}</span>
              <span class="shrink-0 font-mono text-xs text-text-muted transition-transform duration-200 group-hover:-translate-x-1">{{ post.date }}</span>
            </RouterLink>
          </li>
        </ul>
        <RouterLink to="/blog" data-reveal class="group mt-6 inline-flex items-center gap-1 text-sm text-primary">
          <span class="transition-colors group-hover:text-accent">查看全部文章</span>
          <span class="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </RouterLink>
      </section>

      <section class="section-container py-16">
        <SectionTitle title="这座星港怎么逛" over="Start Here" />
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div data-reveal class="card group flex flex-col p-6 transition-transform duration-300 hover:-translate-y-1">
            <span class="font-mono text-xl text-primary">01</span>
            <h3 class="mt-3 text-base font-semibold transition-colors group-hover:text-primary">看项目</h3>
            <p class="mt-1 flex-1 text-sm leading-6 text-text-muted">从 Galaxy Defender 到 2048 Arena，沿星轨逐个巡航。</p>
            <RouterLink to="/projects" class="mt-4 text-sm text-primary hover:underline">启程巡航 →</RouterLink>
          </div>
          <div data-reveal class="card group flex flex-col p-6 transition-transform duration-300 hover:-translate-y-1">
            <span class="font-mono text-xl text-primary">02</span>
            <h3 class="mt-3 text-base font-semibold transition-colors group-hover:text-primary">读博客</h3>
            <p class="mt-1 flex-1 text-sm leading-6 text-text-muted">算法复盘、项目笔记与建站实录，都在航海日志里。</p>
            <RouterLink to="/blog" class="mt-4 text-sm text-primary hover:underline">翻开日志 →</RouterLink>
          </div>
          <div data-reveal class="card group flex flex-col p-6 transition-transform duration-300 hover:-translate-y-1">
            <span class="font-mono text-xl text-primary">03</span>
            <h3 class="mt-3 text-base font-semibold transition-colors group-hover:text-primary">留颗星</h3>
            <p class="mt-1 flex-1 text-sm leading-6 text-text-muted">在星语留言板写下你想对这座星港说的话。</p>
            <RouterLink to="/guestbook" class="mt-4 text-sm text-primary hover:underline">发送星语 →</RouterLink>
          </div>
          <div data-reveal class="card group flex flex-col p-6 transition-transform duration-300 hover:-translate-y-1">
            <span class="font-mono text-xl text-primary">04</span>
            <h3 class="mt-3 text-base font-semibold transition-colors group-hover:text-primary">逛友邻</h3>
            <p class="mt-1 flex-1 text-sm leading-6 text-text-muted">星港之外还有别的灯塔，去看看朋友们的航线。</p>
            <RouterLink to="/friends" class="mt-4 text-sm text-primary hover:underline">前往友邻 →</RouterLink>
          </div>
        </div>
      </section>

      <!-- 星光统计带 + 星港时钟（v1.6） -->
      <section class="section-container pb-24 pt-4">
        <StarStats />
      </section>
    </div>
  </div>
</template>

<style scoped>
/* 视差（v2.7）：--hx/--hy 由 JS 写入（-1..1）。GSAP 入场动画会给子元素设行内
   transform，CSS 会被覆盖——因此视差只作用在 GSAP 不触碰的层级：hero 区整体
   微移 + 轨道装饰/滚动指示反向移动，制造纵深。 */
.hero-parallax {
  --hx: 0;
  --hy: 0;
  transform: translate(calc(var(--hx) * 4px), calc(var(--hy) * 3px));
  transition: transform 0.4s cubic-bezier(0.2, 0.6, 0.3, 1);
}
.hero-parallax :deep(.hero-orbit) {
  transform: translate(calc(var(--hx) * -14px), calc(var(--hy) * -10px)) rotate(-6deg);
  transition: transform 0.45s cubic-bezier(0.2, 0.6, 0.3, 1);
}
.hero-parallax :deep(.scroll-hint) {
  transform: translate(calc(var(--hx) * -8px), calc(var(--hy) * -6px));
  transition: transform 0.4s cubic-bezier(0.2, 0.6, 0.3, 1);
}
@media (prefers-reduced-motion: reduce) {
  .hero-parallax,
  .hero-parallax :deep(.hero-orbit),
  .hero-parallax :deep(.scroll-hint) {
    transform: none;
    transition: none;
  }
}

.hero-caret {
  animation: caret-blink 1s steps(1) infinite;
}

@keyframes caret-blink {
  50% {
    opacity: 0;
  }
}

/* 滚动指示器：点下落循环；滚动 80px 后整体淡出（js 控制 opacity class） */
.scroll-hint {
  transition: opacity 0.3s ease;
}
.scroll-hint.scroll-hint-hidden {
  opacity: 0;
}
.scroll-hint-dot {
  animation: hint-drop 1.6s ease-in-out infinite;
}
@keyframes hint-drop {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  70% {
    transform: translateY(10px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 0;
  }
}

.svg-name {
  font-size: 84px;
  fill: transparent;
  stroke-dasharray: 2500;
  stroke-dashoffset: 2500;
  animation:
    name-draw 2.4s ease-in-out 0.6s forwards,
    name-fill 0.5s ease-in-out 3s forwards;
}

@keyframes name-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes name-fill {
  to {
    fill: url(#nameGrad);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-caret {
    animation: none;
  }

  .scroll-hint-dot {
    animation: none;
  }

  .svg-name {
    fill: url(#nameGrad);
    stroke-dasharray: none;
    stroke-dashoffset: 0;
    animation: none;
  }
}
</style>
