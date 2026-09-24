<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import ThemeSwitcher from '@/components/ui/ThemeSwitcher.vue'

const scrolled = ref(false)
const scrollProgress = ref(0)
function onScroll() {
  scrolled.value = window.scrollY > 50
  const max = document.documentElement.scrollHeight - window.innerHeight
  scrollProgress.value = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0
}
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

const links = [
  { to: '/', label: '首页' },
  { to: '/about', label: '关于', hideSm: true },
  { to: '/projects', label: '项目' },
  { to: '/blog', label: '博客' },
  { to: '/now', label: '日志', hideSm: true },
  { to: '/friends', label: '友邻' },
  { to: '/guestbook', label: '留言' },
]

// 奶龙头像（v1.7.1）：右上角入口，点击前往关于页
const nailongAvatar = `${import.meta.env.BASE_URL}images/nailong-avatar.jpg`
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-50 transition-colors duration-300"
    :class="scrolled ? 'border-b border-white/10 bg-bg/80 backdrop-blur' : ''"
  >
    <nav class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
      <RouterLink to="/" class="glow-text font-mono text-lg font-bold tracking-wide" aria-label="STARLIGHT · 返回首页">
        ✦<span class="ml-1.5 hidden sm:inline">STARLIGHT</span>
      </RouterLink>
      <ul class="flex items-center gap-4 text-sm text-text-muted sm:gap-6">
        <li v-for="link in links" :key="link.to" :class="link.hideSm ? 'hidden sm:block' : ''">
          <RouterLink
            :to="link.to"
            class="group relative inline-block py-1 transition-colors hover:text-text"
            active-class="text-text"
            exact-active-class="text-text"
          >
            {{ link.label }}
            <span
              aria-hidden="true"
              class="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gradient-to-r from-primary to-accent transition-transform duration-300 group-hover:scale-x-100"
            ></span>
          </RouterLink>
        </li>
      </ul>
      <ThemeSwitcher />
      <RouterLink
        to="/about"
        class="group relative ml-1 shrink-0"
        aria-label="奶龙头像 · 关于站长"
        title="奶龙 · 关于站长"
      >
        <img
          :src="nailongAvatar"
          alt=""
          class="h-9 w-9 rounded-full border border-white/15 object-cover transition-all duration-300 group-hover:scale-110 group-hover:border-primary/60 group-hover:glow-orbit-primary"
        />
        <span
          aria-hidden="true"
          class="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary opacity-0 glow-dot-primary transition-opacity duration-300 group-hover:opacity-100"
        ></span>
      </RouterLink>
    </nav>
    <div v-if="scrolled" class="absolute inset-x-0 bottom-0 h-[3px] bg-white/5">
      <div
        class="h-full bg-gradient-to-r from-primary to-accent glow-bar-accent transition-[width] duration-100 ease-out"
        :style="{ width: scrollProgress + '%' }"
      ></div>
    </div>
  </header>
</template>
