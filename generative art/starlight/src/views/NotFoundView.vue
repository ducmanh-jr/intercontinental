<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const currentPath = computed(() => useRoute().fullPath.split('?')[0])

// v1.6：3 秒后自动返回首页（可点链接取消）；reduced-motion 不影响（纯计时）
const countdown = ref(3)
let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      if (timer) clearInterval(timer)
      const base = import.meta.env.BASE_URL
      window.location.href = base
    }
  }, 1000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <section class="section-container flex min-h-[60vh] flex-col justify-center font-mono">
    <pre
      aria-hidden="true"
      class="mb-6 text-[10px] leading-[1.4] text-primary/40 select-none"
    >          .     .        .       .
      .       *       .     .    .
        .    .     .    *   .      .
     .      ✦     .      .    .    .
        .    .    .     .    ✦    .
      .      .    ✦    .      .    .</pre>
    <p class="text-text-muted">$ cd /{{ currentPath }}</p>
    <h1 class="mt-2 text-xl text-text">404: command not found: {{ currentPath }}</h1>
    <p class="mt-4 text-sm text-text-muted">这个坐标上没有天体——页面不存在，或已被移动。</p>
    <p class="mt-2 text-sm text-text-muted">
      信号丢失，<span class="text-primary">{{ countdown }}</span> 秒后自动返航
      <RouterLink to="/" class="text-primary hover:underline">（或点击这里立即返回）</RouterLink>
    </p>
    <RouterLink
      to="/"
      class="mt-6 inline-flex w-fit items-center gap-2 rounded-lg border border-white/10 px-5 py-2.5 text-sm transition-colors hover:border-primary/50"
    >
      cd ~ 返回首页
    </RouterLink>
  </section>
</template>
