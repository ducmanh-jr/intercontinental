<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listPostMetas, blogMetas, type BlogMeta } from '@/lib/blog'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import { useGsapReveal } from '@/composables/useGsapReveal'
import { useInertiaTilt } from '@/composables/useInertiaTilt'

const router = useRouter()
const posts = listPostMetas(blogMetas)
const scopeRef = ref<HTMLElement | null>(null)
useGsapReveal(scopeRef)

// 随机漫游（v2.5）：从当前筛选结果里随机跳一篇——33 篇知识库的「手气不错」
function wander() {
  const pool = filteredPosts.value.length ? filteredPosts.value : posts
  void router.push(`/blog/${pool[Math.floor(Math.random() * pool.length)].slug}`)
}

// 文章页语法包 idle 预载（v2.5）：列表页空闲时把 BlogPostView（连带 shiki cpp/主题）
// 拉进缓存，首次点开文章代码高亮零等待。失败静默（真导航时再拉）。
let preloaded = false
function idlePreloadPostView() {
  if (preloaded) return
  preloaded = true
  const idle =
    'requestIdleCallback' in window
      ? window.requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 1200)
  idle(() => {
    void import('@/views/BlogPostView.vue').catch(() => {})
  })
}

// v1.6：标签筛选 + 标题/摘要搜索（纯前端，无依赖）
// v2.0：两级标签——一级分类（算法竞赛/生活/项目/AI…）+ 二级知识点标签。
// 分类行常驻；知识点行只在选中分类后出现，避免几十个标签芯片糊成一团。
const activeCategory = ref<string | null>(null)
const activeTag = ref<string | null>(null)
const query = ref('')

// 固定分类顺序（未列出的分类按出现顺序追加在后面）
const CATEGORY_ORDER = ['算法竞赛', '生活', '项目', 'AI']
const CATEGORY_ICON: Record<string, string> = {
  算法竞赛: '✦',
  生活: '☕',
  项目: '⚡',
  AI: '◈',
}
const categories = computed(() => {
  const seen = new Set(posts.map((p) => p.category))
  const ordered = CATEGORY_ORDER.filter((c) => seen.has(c))
  return ordered.concat([...seen].filter((c) => !ordered.includes(c)))
})

const postsOfCategory = computed(() =>
  activeCategory.value ? posts.filter((p) => p.category === activeCategory.value) : posts,
)
// 知识点标签 = 当前分类下文章的 tags（排除与分类同名的标签，避免重复）
const tags = computed(() => [
  ...new Set(postsOfCategory.value.flatMap((p) => p.tags.filter((t) => t !== p.category))),
].sort())
const countOf = (c: string) => posts.filter((p) => p.category === c).length

// 归档时间线视图（v2.6）：按月分组；尊重当前分类/标签筛选
const archiveView = ref(false)
const archiveGroups = computed(() => {
  const map = new Map<string, BlogMeta[]>()
  for (const post of filteredPosts.value) {
    const month = post.date.slice(0, 7)
    if (!map.has(month)) map.set(month, [])
    map.get(month)!.push(post)
  }
  return [...map.entries()]
})

function selectCategory(c: string | null) {
  activeCategory.value = c
  activeTag.value = null // 换分类时重置知识点，防止筛出空集
}

const filteredPosts = computed(() =>
  postsOfCategory.value.filter((p) => {
    if (activeTag.value && !p.tags.includes(activeTag.value)) return false
    const q = query.value.trim().toLowerCase()
    if (!q) return true
    return (
      p.title.toLowerCase().includes(q) ||
      (p.desc ?? '').toLowerCase().includes(q)
    )
  }),
)

// 目录行磁吸惯性：每行一个实例（按 slug 映射，过滤后行号变化也不串位）
const tiltMap = new Map<string, { el: ReturnType<typeof ref<HTMLElement | null>>; attach: () => void }>()
posts.forEach((p) => {
  const el = ref<HTMLElement | null>(null)
  const { attach } = useInertiaTilt(el, 3)
  tiltMap.set(p.slug, { el, attach })
})
onMounted(() => {
  tiltMap.forEach((t) => t.attach())
  idlePreloadPostView()
})

function setRowRef(post: BlogMeta, node: unknown) {
  const inst = node as { $el?: unknown } | null
  const el = inst && inst.$el instanceof HTMLElement ? inst.$el : null
  const slot = tiltMap.get(post.slug)
  if (slot) slot.el.value = el
}
</script>

<template>
  <section ref="scopeRef" class="section-container min-h-[60vh]">
    <SectionTitle over="Blog" title="博客" as="h1" subtitle="记录学习与思考" />
    <div v-if="posts.length === 0" class="border border-dashed border-white/10 rounded-xl py-20 text-center">
      <p class="text-4xl">🛰️</p>
      <p class="mt-4 text-text">信号还在深空漂移……第一条日志即将抵达。</p>
    </div>
    <div v-else class="flex flex-col">
      <!-- 搜索 + 两级标签筛选（v2.0） -->
      <div data-reveal class="mb-8 space-y-4">
        <div class="relative">
          <input
            v-model="query"
            type="search"
            placeholder="搜索标题或摘要…"
            aria-label="搜索文章"
            class="w-full rounded-lg border border-white/10 bg-surface/60 px-4 py-2.5 pl-10 pr-28 text-sm text-text placeholder:text-text-muted/50 focus:border-primary/50 focus:outline-none"
          />
          <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-text-muted/50" aria-hidden="true">⌕</span>
          <button
            type="button"
            class="group absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-xs text-accent transition-all hover:border-accent hover:bg-accent/20"
            title="从当前筛选结果中随机打开一篇"
            @click="wander"
          >
            <span class="inline-block transition-transform duration-300 group-hover:rotate-180" aria-hidden="true">✦</span>
            随机漫游
          </button>
        </div>
        <!-- 一级：分类 -->
        <div class="flex flex-wrap items-center gap-2" role="group" aria-label="文章分类">
          <span class="mr-1 font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted/40">分类</span>
          <button
            type="button"
            class="rounded-full border px-4 py-1.5 text-sm transition-all duration-200"
            :class="
              activeCategory === null
                ? 'border-primary/60 bg-primary/10 text-primary'
                : 'border-white/10 text-text-muted hover:border-white/30 hover:text-text'
            "
            @click="selectCategory(null)"
          >
            全部
            <span class="ml-1 font-mono text-[10px] opacity-60">{{ posts.length }}</span>
          </button>
          <button
            v-for="cat in categories"
            :key="cat"
            type="button"
            class="rounded-full border px-4 py-1.5 text-sm transition-all duration-200"
            :class="
              activeCategory === cat
                ? 'border-primary/60 bg-primary/10 text-primary'
                : 'border-white/10 text-text-muted hover:border-white/30 hover:text-text'
            "
            @click="selectCategory(activeCategory === cat ? null : cat)"
          >
            <span aria-hidden="true" class="mr-1">{{ CATEGORY_ICON[cat] ?? '·' }}</span>{{ cat }}
            <span class="ml-1 font-mono text-[10px] opacity-60">{{ countOf(cat) }}</span>
          </button>
        </div>
        <!-- 视图切换：列表 / 归档（v2.6） -->
        <button
          type="button"
          class="ml-auto shrink-0 rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-text-muted transition-all hover:border-primary/40 hover:text-primary"
          :class="{ 'border-primary/50 text-primary': archiveView }"
          :aria-pressed="archiveView"
          @click="archiveView = !archiveView"
        >
          {{ archiveView ? '☰ 列表视图' : '◷ 归档视图' }}
        </button>
        <!-- 二级：知识点（选中分类后出现） -->
        <div
          v-if="activeCategory && tags.length"
          class="flex flex-wrap items-center gap-1.5 border-l-2 border-white/5 pl-3"
          role="group"
          aria-label="知识点标签"
        >
          <span class="mr-1 font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted/40">知识点</span>
          <button
            type="button"
            class="rounded-full border px-3 py-1 font-mono text-xs transition-all duration-200"
            :class="
              activeTag === null
                ? 'border-accent/50 bg-accent/10 text-accent'
                : 'border-white/10 text-text-muted hover:border-white/30 hover:text-text'
            "
            @click="activeTag = null"
          >
            全部
          </button>
          <button
            v-for="tag in tags"
            :key="tag"
            type="button"
            class="rounded-full border px-3 py-1 font-mono text-xs transition-all duration-200"
            :class="
              activeTag === tag
                ? 'border-accent/50 bg-accent/10 text-accent'
                : 'border-white/10 text-text-muted hover:border-white/30 hover:text-text'
            "
            @click="activeTag = activeTag === tag ? null : tag"
          >
            #{{ tag }}
          </button>
        </div>
      </div>

      <p v-if="filteredPosts.length === 0" class="py-16 text-center font-mono text-sm text-text-muted">
        🛰️ 没有匹配的信号，换个关键词试试。
      </p>
      <!-- 归档时间线（v2.6）：月分组 + 竖线 -->
      <div v-else-if="archiveView" class="border-l border-white/10 pl-6">
        <section v-for="[month, group] in archiveGroups" :key="month" class="relative mb-8">
          <span aria-hidden="true" class="absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full border border-primary/50 bg-bg"></span>
          <p class="flex items-baseline gap-3">
            <span class="font-mono text-sm font-semibold text-primary">{{ month }}</span>
            <span class="font-mono text-[10px] text-text-muted/50">{{ group.length }} 篇</span>
          </p>
          <ul class="mt-3 space-y-2.5">
            <li v-for="post in group" :key="post.slug">
              <RouterLink :to="`/blog/${post.slug}`" class="group flex items-baseline gap-3 text-sm">
                <span class="w-16 shrink-0 font-mono text-xs text-text-muted/50">{{ post.date.slice(8) }} 日</span>
                <span v-if="post.difficulty" class="shrink-0 text-[10px] leading-none">
                  <span class="text-accent/90">{{ '★'.repeat(post.difficulty) }}</span>
                </span>
                <span class="text-text-muted transition-colors group-hover:text-primary">{{ post.title }}</span>
              </RouterLink>
            </li>
          </ul>
        </section>
      </div>
      <template v-else>
        <RouterLink
          v-for="post in filteredPosts"
          :key="post.slug"
          :ref="(node) => setRowRef(post, node)"
          :to="`/blog/${post.slug}`"
          class="group -mx-3 flex items-baseline gap-6 rounded-lg border-b border-white/10 px-3 py-4 transition-colors duration-200 hover:border-white/20 hover:bg-white/[0.03]"
        >
          <span class="w-28 shrink-0 font-mono text-xs text-text-muted transition-colors group-hover:text-primary/80">{{ post.date }}</span>
          <span v-if="post.difficulty" class="shrink-0 text-[11px] leading-none tracking-tight" :aria-label="`难度 ${post.difficulty} 星`" :title="`难度 ${post.difficulty}/5`">
            <span class="text-accent/90">{{ '★'.repeat(post.difficulty) }}</span><span class="text-white/15">{{ '★'.repeat(5 - post.difficulty) }}</span>
          </span>
          <span class="flex-1 text-base font-semibold text-text transition-all group-hover:translate-x-1 group-hover:text-primary md:text-lg">{{ post.title }}</span>
          <span v-if="post.tags.filter((t) => t !== post.category).length" class="hidden shrink-0 font-mono text-[10px] text-text-muted/60 sm:inline">{{ post.tags.filter((t) => t !== post.category).map((t) => `#${t}`).join(' ') }}</span>
          <span class="shrink-0 text-text-muted transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary">↗</span>
        </RouterLink>
      </template>
    </div>
  </section>
</template>
