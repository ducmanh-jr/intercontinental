<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { profile } from '@/data/profile'

const router = useRouter()
const open = ref(false)
const pendingG = ref(false)
const feedback = ref('')
let feedbackTimer: ReturnType<typeof setTimeout> | null = null
let pendingGTimer: ReturnType<typeof setTimeout> | null = null

const shortcuts: { keys: string[]; desc: string; feedback?: boolean }[] = [
  { keys: ['g', 'h'], desc: '首页' },
  { keys: ['g', 'a'], desc: '关于' },
  { keys: ['g', 'p'], desc: '项目' },
  { keys: ['g', 'b'], desc: '博客' },
  { keys: ['g', 'n'], desc: '日志' },
  { keys: ['g', 'f'], desc: '友邻' },
  { keys: ['g', 'm'], desc: '留言板' },
  { keys: ['r'], desc: '随机漫游一篇' },
  { keys: ['c'], desc: '复制邮箱', feedback: true },
  { keys: ['esc'], desc: '关闭' },
]

function isTypingTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
}

// v2.11：中文输入法下 e.key 可能是全角（？／ｇ）或被 IME 拦截——
// 用 e.code（物理键位，不受输入法影响）判定；e.key 全角形态作兜底
function physKey(e: KeyboardEvent): string {
  if (e.code === 'Slash') return '?'
  if (e.code === 'KeyG') return 'g'
  if (e.code === 'KeyC') return 'c'
  if (e.code === 'KeyR') return 'r'
  // IME 全角兜底
  const k = e.key
  if (k === '？') return '?'
  if (k === 'ｇ' || k === 'g') return 'g'
  if (k === 'ｃ' || k === 'c') return 'c'
  if (k === 'ｒ' || k === 'r') return 'r'
  return k
}

function showFeedback(msg: string) {
  feedback.value = msg
  if (feedbackTimer !== null) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    feedback.value = ''
    feedbackTimer = null
  }, 1500)
}

async function wanderRandom() {
  const { listPostMetas, blogMetas } = await import('@/lib/blog')
  const posts = listPostMetas(blogMetas)
  if (!posts.length) return
  void router.push(`/blog/${posts[Math.floor(Math.random() * posts.length)].slug}`)
  close()
}

async function copyEmail() {
  const social = profile.socials.find((s) => s.label === '邮箱')
  const email = (social?.url ?? '').replace(/^mailto:/, '')
  try {
    await navigator.clipboard.writeText(email)
    showFeedback('已复制邮箱 ✓')
  } catch {
    showFeedback('复制失败')
  }
}

function close() {
  open.value = false
  pendingG.value = false
}

// v2.11：快捷键全局可用（不必先按 ? 打开面板——那正是「按了没反应」的根因）。
// 输入态（input/textarea/可编辑区）不触发；Ctrl/Cmd/Alt 组合键（Ctrl+R 刷新等）不劫持。
// g 前缀 1.2s 内未按目标键自动复位，避免误吞后续单键。
function onKeydown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return // 浏览器组合键（Ctrl+R/Ctrl+G 等）不劫持
  const key = physKey(e)
  if (key === '?') {
    if (isTypingTarget(e)) return
    e.preventDefault()
    open.value = !open.value
    if (!open.value) pendingG.value = false
    return
  }
  if (e.key === 'Escape') {
    if (open.value) close()
    return
  }
  if (isTypingTarget(e)) return
  if (pendingG.value) {
    const targets: Record<string, string> = { h: '/', a: '/about', p: '/projects', b: '/blog', n: '/now', f: '/friends', m: '/guestbook' }
    const path = targets[key]
    pendingG.value = false
    if (path) {
      void router.push(path)
      close()
    }
    return
  }
  if (key === 'g') {
    pendingG.value = true
    if (pendingGTimer !== null) clearTimeout(pendingGTimer)
    pendingGTimer = setTimeout(() => {
      pendingG.value = false
      pendingGTimer = null
    }, 1200)
    return
  }
  if (key === 'c') {
    void copyEmail()
  }
  if (key === 'r') {
    void wanderRandom()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (feedbackTimer !== null) clearTimeout(feedbackTimer)
  if (pendingGTimer !== null) clearTimeout(pendingGTimer)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[80] flex items-center justify-center p-4"
        role="dialog"
        aria-label="快捷键"
      >
        <div class="absolute inset-0 bg-black/60" @click="close"></div>
        <div class="card relative w-full max-w-md p-6">
          <h2 class="text-lg font-semibold">快捷键</h2>
          <ul class="mt-4 space-y-2.5">
            <li
              v-for="item in shortcuts"
              :key="item.keys.join('')"
              class="flex items-center justify-between text-sm"
            >
              <span class="flex items-center gap-1.5">
                <kbd
                  v-for="k in item.keys"
                  :key="k"
                  class="rounded border border-white/20 bg-surface px-2 py-0.5 font-mono text-xs"
                >
                  {{ k }}
                </kbd>
              </span>
              <span class="flex items-center gap-2 text-text-muted">
                {{ item.desc }}
                <span v-if="item.feedback && feedback" class="text-xs text-primary">{{ feedback }}</span>
              </span>
            </li>
          </ul>
          <p v-if="pendingG" class="mt-4 text-xs text-primary">按下 g 后请按目标键…</p>
          <p class="mt-4 border-t border-white/10 pt-3 text-[11px] leading-5 text-text-muted/70">
            这些快捷键在站内任意位置直接可用（输入框内除外），不必先打开本面板。中文输入法下同样有效。
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
