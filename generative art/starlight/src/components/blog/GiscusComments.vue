<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { giscusConfig } from '@/config/giscus'
import { useTheme, themeDef } from '@/composables/useTheme'

// giscus 评论区（v2.11 重构）：
// 1) 滚动预载：距视口 600px 即开始拉 giscus 脚本，滚到位时基本就绪（原来是点击才加载，感知慢）
// 2) 主题跟随：浅色站点主题用 giscus light，切主题时 postMessage 通知 iframe 免刷新换肤
// 3) 慢网/受限降级：8s 未就绪或脚本加载失败时，给出 GitHub Discussions 直达出口
const { current } = useTheme()

type State = 'idle' | 'loading' | 'ready' | 'error'
const state = ref<State>('idle')
const slow = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const container = ref<HTMLElement | null>(null)

let observer: IntersectionObserver | null = null
let slowTimer: ReturnType<typeof setTimeout> | null = null

/** 失败/缓慢后的手动重试：清掉失败的 script 节点回到 idle，再走正常加载 */
function retry() {
  if (container.value) container.value.innerHTML = ''
  state.value = 'idle'
  slow.value = false
  if (slowTimer) clearTimeout(slowTimer)
  loadComments()
}

function giscusThemeOf(key: string): string {
  return themeDef(key).giscus
}

// 已渲染后切主题：让 giscus iframe 同步换肤（giscus 官方 postMessage 协议）
watch(current, (key) => {
  const iframe = container.value?.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
  iframe?.contentWindow?.postMessage(
    { giscus: { setConfig: { theme: giscusThemeOf(key) } } },
    'https://giscus.app',
  )
})

function loadComments() {
  if (state.value !== 'idle' || !giscusConfig.categoryId) return
  state.value = 'loading'
  slowTimer = setTimeout(() => (slow.value = true), 8000)
  const s = document.createElement('script')
  s.src = 'https://giscus.app/client.js'
  s.async = true
  s.crossOrigin = 'anonymous'
  s.setAttribute('data-repo', giscusConfig.repo)
  s.setAttribute('data-repo-id', giscusConfig.repoId)
  s.setAttribute('data-category', giscusConfig.category)
  s.setAttribute('data-category-id', giscusConfig.categoryId)
  s.setAttribute('data-mapping', 'pathname')
  s.setAttribute('data-strict', '0')
  s.setAttribute('data-reactions-enabled', '1')
  s.setAttribute('data-emit-metadata', '0')
  s.setAttribute('data-theme', giscusThemeOf(current.value))
  s.setAttribute('data-lang', 'zh-CN')
  s.setAttribute('data-loading', 'lazy')
  s.onload = () => {
    state.value = 'ready'
    if (slowTimer) clearTimeout(slowTimer)
  }
  s.onerror = () => {
    state.value = 'error'
    if (slowTimer) clearTimeout(slowTimer)
  }
  container.value?.appendChild(s)
}

onMounted(() => {
  if (!giscusConfig.categoryId) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        loadComments()
        observer?.disconnect()
      }
    },
    { rootMargin: '600px 0px' },
  )
  if (rootRef.value) observer.observe(rootRef.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  if (slowTimer) clearTimeout(slowTimer)
})
</script>

<template>
  <div ref="rootRef" class="mt-12 border-t border-white/10 pt-6">
    <!-- 待载：手动按钮（滚动预载通常会先一步触发） -->
    <button
      v-if="state === 'idle' && giscusConfig.categoryId"
      type="button"
      class="rounded-lg border border-white/10 px-4 py-2 text-sm text-text-muted transition-colors hover:text-text"
      @click="loadComments"
    >
      💬 加载评论区（需 GitHub 登录）
    </button>

    <!-- 载入中：骨架屏（三行微光占位，避免高度跳变） -->
    <div v-if="state === 'loading'" aria-live="polite">
      <p class="flex items-center gap-2 text-sm text-text-muted">
        <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-primary"></span>
        评论区信号接收中…
      </p>
      <div class="mt-4 space-y-3" aria-hidden="true">
        <div class="comment-skeleton h-4 w-3/4 rounded"></div>
        <div class="comment-skeleton h-4 w-1/2 rounded"></div>
        <div class="comment-skeleton h-4 w-2/3 rounded"></div>
      </div>
    </div>

    <!-- 慢网/失败降级出口：GitHub Discussions 永远可达 + 可重试 -->
    <div
      v-if="(slow && state === 'loading') || state === 'error'"
      class="mt-4 rounded-lg border border-white/10 bg-surface/50 p-3 text-sm leading-6 text-text-muted"
    >
      <template v-if="state === 'error'">评论区脚本加载失败（giscus.app 可能被网络环境拦截）。</template>
      <template v-else>评论区加载缓慢，可能是网络环境限制了 giscus.app。</template>
      <button type="button" class="mr-1 text-primary hover:underline" @click="retry">重试</button>
      或
      <a
        :href="`https://github.com/${giscusConfig.repo}/discussions`"
        target="_blank"
        rel="noopener"
        class="text-primary hover:underline"
        >直接到 GitHub Discussions 留言 ↗</a
      >，内容会同步显示在这里。
    </div>

    <p v-if="!giscusConfig.categoryId" class="text-sm text-text-muted">
      评论区尚未配置（等待站点所有者完成 giscus 设置）
    </p>
    <div v-show="state === 'ready' || state === 'loading'" ref="container"></div>
  </div>
</template>

<style scoped>
.comment-skeleton {
  background: linear-gradient(
    90deg,
    color-mix(in oklab, var(--color-text) 8%, transparent),
    color-mix(in oklab, var(--color-text) 14%, transparent),
    color-mix(in oklab, var(--color-text) 8%, transparent)
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}
@keyframes skeleton-shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .comment-skeleton {
    animation: none;
  }
}
</style>
