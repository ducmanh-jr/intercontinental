<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listPostMetas, blogMetas, loadPostRaw, countWords, readingTimeMinutes } from '@/lib/blog'
import { renderMarkdown } from '@/lib/markdown'
import GiscusComments from '@/components/blog/GiscusComments.vue'

const route = useRoute()
const router = useRouter()
// v2.18 性能重构：meta（标题/日期/标签/难度/上下篇）来自构建期解析的轻量列表，
// 同步立即可用；全文（raw markdown）按 slug 懒加载，到位后渲染正文与目录。
const post = computed(() =>
  listPostMetas(blogMetas).find((p) => p.slug === route.params.slug),
)
const rawContent = ref('')
const contentLoading = ref(true)
const html = computed(() => (rawContent.value ? renderMarkdown(rawContent.value) : ''))

const wordCount = computed(() => (rawContent.value ? countWords(rawContent.value) : 0))
const minutes = computed(() => (rawContent.value ? readingTimeMinutes(rawContent.value) : 0))

const progress = ref(0)

// 上一篇/下一篇（v2.3）：列表按日期倒序，prev 更新、next 更早
const ordered = computed(() => listPostMetas(blogMetas))
const postIdx = computed(() => ordered.value.findIndex((p) => p.slug === route.params.slug))
const prevPost = computed(() => (postIdx.value > 0 ? ordered.value[postIdx.value - 1] : null))
const nextPost = computed(() =>
  postIdx.value >= 0 && postIdx.value < ordered.value.length - 1
    ? ordered.value[postIdx.value + 1]
    : null,
)

// 相关文章（v2.5）：按标签重合度推荐——同标签数降序、同级按日期取新，排除本文，最多 3 篇；
// 同分类算 0.5 分保底，保证「相关」区块基本不会空。
const relatedPosts = computed(() => {
  const cur = post.value
  if (!cur) return []
  return ordered.value
    .filter((p) => p.slug !== cur.slug)
    .map((p) => ({
      p,
      score: p.tags.filter((t) => cur.tags.includes(t)).length + (p.category === cur.category ? 0.5 : 0),
    }))
    .sort((a, b) => b.score - a.score || (a.p.date < b.p.date ? 1 : -1))
    .slice(0, 3)
    .map((s) => s.p)
})

// 图片 Lightbox（v2.5）：正文图片点击全屏查看（图多为细节示意图，放大有用）；Esc/点击遮罩关闭
const lightboxSrc = ref('')
function onContentClick(e: MouseEvent) {
  const img = (e.target as HTMLElement).closest('img')
  if (img) lightboxSrc.value = img.getAttribute('src') ?? ''
}
function onLightboxKey(e: KeyboardEvent) {
  if (e.key === 'Escape') lightboxSrc.value = ''
  // ←/→ 翻篇（v2.5）：body 焦点时才接管（输入框/代码块滚动不劫持）；prev 更新、next 更早
  if (lightboxSrc.value) return
  const t = e.target as HTMLElement | null
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
  if (e.key === 'ArrowRight' && prevPost.value) void router.push(`/blog/${prevPost.value.slug}`)
  if (e.key === 'ArrowLeft' && nextPost.value) void router.push(`/blog/${nextPost.value.slug}`)
}
onMounted(() => window.addEventListener('keydown', onLightboxKey))
onUnmounted(() => window.removeEventListener('keydown', onLightboxKey))

// 悬浮目录（v2.1）：从渲染后的正文提取 h2 锚点，滚动时高亮当前小节。
// 目录条固定在 xl 以上宽屏右侧空白区，窄屏不渲染。
const contentEl = ref<HTMLElement | null>(null)
const headings = ref<{ id: string; text: string }[]>([])
const activeId = ref('')

function collectHeadings() {
  headings.value = [...(contentEl.value?.querySelectorAll<HTMLElement>('h2[id]') ?? [])].map(
    (h) => ({ id: h.id, text: h.textContent ?? '' }),
  )
}

// 代码块增强（v2.3）：悬浮复制按钮 + 语言角标。v-html 重渲染后需重挂。
function enhanceCodeBlocks() {
  for (const pre of contentEl.value?.querySelectorAll('pre') ?? []) {
    if (pre.querySelector('.copy-btn')) continue
    const lang = /language-([\w-]+)/.exec(pre.querySelector('code')?.className ?? '')?.[1]
    if (lang && lang !== 'text') {
      const chip = document.createElement('span')
      chip.className = 'code-lang'
      chip.textContent = lang
      pre.appendChild(chip)
    }
    const btn = document.createElement('button')
    btn.className = 'copy-btn'
    btn.type = 'button'
    btn.textContent = '复制'
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pre.querySelector('code')?.textContent ?? '')
        btn.textContent = '已复制 ✓'
      } catch {
        btn.textContent = '复制失败'
      }
      setTimeout(() => (btn.textContent = '复制'), 1600)
    })
    pre.appendChild(btn)
  }
}
function syncActiveHeading() {
  const hs = contentEl.value?.querySelectorAll<HTMLElement>('h2[id]')
  if (!hs || !hs.length) return
  let current = hs[0].id
  for (const h of hs) {
    if (h.getBoundingClientRect().top < 140) current = h.id
  }
  activeId.value = current
}
function onScroll() {
  const h = document.documentElement
  const max = h.scrollHeight - h.clientHeight
  progress.value = max > 0 ? Math.min(100, Math.round((h.scrollTop / max) * 100)) : 0
  syncActiveHeading()
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
// v2.18：全文懒加载——meta 已同步渲染（标题区立即出），raw 到位后 v-html 更新，
// watch 回调里的 collectHeadings/enhance 在 nextTick 后跑（渲染顺序天然正确）。
// v2.18.1 竞态守卫：←/→ 快速翻篇时，前一篇的慢请求可能晚于后一篇返回——
// 用自增令牌丢弃过期响应，防止旧正文覆盖新路由。
let loadToken = 0
watch(
  () => route.params.slug,
  async (slug) => {
    const token = ++loadToken
    contentLoading.value = true
    rawContent.value = ''
    const raw = await loadPostRaw(String(slug))
    if (token !== loadToken) return // 已翻到另一篇，本次结果作废
    rawContent.value = raw ?? ''
    contentLoading.value = false
    await nextTick()
    collectHeadings()
    enhanceCodeBlocks()
    onScroll()
  },
  { immediate: true },
)
</script>

<template>
  <div
    class="fixed left-0 top-0 z-[60] h-0.5 bg-primary transition-[width] duration-150"
    :style="{ width: progress + '%' }"
    aria-hidden="true"
  ></div>
  <article class="section-container min-h-[60vh] max-w-3xl">
    <div v-if="post">
      <!-- 返回博客列表（v1.8）：置顶悬浮在左上角，随时可撤离 -->
      <RouterLink
        to="/blog"
        class="group -ml-2 mb-8 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-surface/60 px-3 py-1.5 text-sm text-text-muted backdrop-blur transition-all hover:border-primary/50 hover:text-primary"
      >
        <span aria-hidden="true" class="transition-transform duration-200 group-hover:-translate-x-0.5">←</span>
        返回博客
      </RouterLink>
      <!-- 悬浮目录（xl+ 宽屏）：scroll-spy 高亮当前小节 -->
      <nav
        v-if="headings.length > 1"
        aria-label="文章目录"
        class="fixed right-6 top-32 z-30 hidden w-44 xl:block"
      >
        <p class="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/40">On this page</p>
        <ul class="space-y-0.5 border-l border-white/5">
          <li v-for="h in headings" :key="h.id">
            <a
              :href="`#${h.id}`"
              class="block truncate border-l-2 py-1 pl-3 text-xs transition-all duration-200"
              :class="
                activeId === h.id
                  ? '-ml-px border-primary text-primary'
                  : 'border-transparent text-text-muted/50 hover:text-text'
              "
            >
              {{ h.text }}
            </a>
          </li>
        </ul>
      </nav>
      <h1 class="text-3xl font-bold md:text-4xl">{{ post.title }}</h1>
      <div class="mt-3 flex items-center gap-4 font-mono text-sm text-text-muted">
        <time>{{ post.date }}</time>
        <span v-for="tag in post.tags" :key="tag">#{{ tag }}</span>
        <span class="text-text-muted">
          <template v-if="contentLoading">统计中…</template>
          <template v-else>约 {{ wordCount }} 字 · 阅读 {{ minutes }} 分钟</template>
        </span>
        <span v-if="post.difficulty" class="text-xs leading-none tracking-tight" :aria-label="`难度 ${post.difficulty} 星`">
          <span class="text-accent/90">{{ '★'.repeat(post.difficulty) }}</span><span class="text-white/15">{{ '★'.repeat(5 - post.difficulty) }}</span>
        </span>
      </div>
      <!-- v2.18 全文懒加载：meta 秒出，正文骨架占位（防高度跳变） -->
      <div v-if="contentLoading" class="blog-content mt-10 space-y-4" aria-live="polite">
        <div class="h-4 w-2/3 animate-pulse rounded bg-text/10"></div>
        <div class="h-4 w-full animate-pulse rounded bg-text/10"></div>
        <div class="h-4 w-5/6 animate-pulse rounded bg-text/10"></div>
        <div class="h-32 w-full animate-pulse rounded-lg bg-text/10"></div>
        <div class="h-4 w-1/2 animate-pulse rounded bg-text/10"></div>
        <p class="pt-2 font-mono text-xs text-text-muted/60">正在从星港书库调取全文…</p>
      </div>
      <!-- eslint-disable-next-line vue/no-v-html -- 内容经 markdown-it（html:false）+ shiki 渲染，无原始 HTML 通过，XSS 面有测试覆盖 -->
      <div v-else ref="contentEl" class="blog-content mt-10" @click="onContentClick" v-html="html"></div>

      <!-- 上一篇 / 下一篇（v2.3） -->
      <nav v-if="prevPost || nextPost" aria-label="相邻文章" class="mt-14 grid gap-4 sm:grid-cols-2">
        <RouterLink
          v-if="prevPost"
          :to="`/blog/${prevPost.slug}`"
          class="group rounded-xl border border-white/10 bg-surface/60 p-4 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40"
        >
          <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted/50">← 上一篇</p>
          <p class="mt-1.5 truncate text-sm text-text transition-colors group-hover:text-primary">
            {{ prevPost.title }}
          </p>
        </RouterLink>
        <span v-else aria-hidden="true"></span>
        <RouterLink
          v-if="nextPost"
          :to="`/blog/${nextPost.slug}`"
          class="group rounded-xl border border-white/10 bg-surface/60 p-4 text-right backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40"
        >
          <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted/50">下一篇 →</p>
          <p class="mt-1.5 truncate text-sm text-text transition-colors group-hover:text-primary">
            {{ nextPost.title }}
          </p>
        </RouterLink>
      </nav>
      <!-- 相关文章（v2.5）：按标签重合度推荐 -->
      <section v-if="relatedPosts.length" aria-label="相关文章" class="mt-12">
        <p class="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/40">✦ 相关漫游</p>
        <div class="grid gap-3 sm:grid-cols-3">
          <RouterLink
            v-for="rp in relatedPosts"
            :key="rp.slug"
            :to="`/blog/${rp.slug}`"
            class="group rounded-xl border border-white/10 bg-surface/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40"
          >
            <p class="font-mono text-[10px] text-text-muted/40">{{ rp.date }}</p>
            <p class="mt-1.5 line-clamp-2 text-sm leading-5 text-text transition-colors group-hover:text-primary">
              {{ rp.title }}
            </p>
          </RouterLink>
        </div>
      </section>
      <GiscusComments />
    </div>
    <p v-else class="text-text-muted">文章不存在</p>
  </article>

  <!-- 图片 Lightbox：点击遮罩 / Esc 关闭 -->
  <Teleport to="body">
    <Transition name="lb">
      <div
        v-if="lightboxSrc"
        class="fixed inset-0 z-[90] flex cursor-zoom-out items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
        role="dialog"
        aria-label="图片放大查看"
        @click="lightboxSrc = ''"
      >
        <img
          :src="lightboxSrc"
          class="max-h-[88vh] max-w-[92vw] rounded-xl border border-white/15 shadow-2xl"
          alt="放大查看的示意图"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 正文图片：可放大查看的暗示光标 */
.blog-content :deep(img) {
  cursor: zoom-in;
}
.lb-enter-active,
.lb-leave-active {
  transition: opacity 0.18s ease;
}
.lb-enter-active img {
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.lb-enter-from,
.lb-leave-to {
  opacity: 0;
}
.lb-enter-from img {
  transform: scale(0.92);
}
@media (prefers-reduced-motion: reduce) {
  .lb-enter-active,
  .lb-leave-active,
  .lb-enter-active img {
    transition: none;
  }
}
</style>
