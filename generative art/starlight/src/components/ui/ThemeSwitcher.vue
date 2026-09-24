<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useTheme } from '@/composables/useTheme'

// 主题切换器（v1.9）：导航右上角的调色盘按钮，弹出主题卡片选择
const { themes, current, applyTheme } = useTheme()
const open = ref(false)
const root = ref<HTMLElement | null>(null)

function onDocClick(e: MouseEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      aria-label="切换主题"
      title="切换主题"
      class="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-text-muted transition-all duration-300 hover:border-primary/60 hover:text-primary hover-glow-primary"
      @click="open = !open"
    >
      <svg viewBox="0 0 24 24" class="h-4.5 w-4.5" :class="open ? 'animate-none' : ''" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 1.5-2s-.5-2 1-2h2.5a4 4 0 0 0 4-4c0-5-4.5-10-9-10Z" fill="currentColor" fill-opacity="0.25" stroke="none" />
        <circle cx="8" cy="10" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="16" cy="10" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    </button>
    <Transition name="pop">
      <div
        v-if="open"
        class="card absolute right-0 top-12 z-50 w-56 p-3"
        role="menu"
        aria-label="主题选择"
      >
        <p class="px-1 pb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/60">Theme · 主题</p>
        <button
          v-for="t in themes"
          :key="t.key"
          type="button"
          class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5"
          :class="current === t.key ? 'ring-1 ring-primary/40' : ''"
          role="menuitem"
          @click="applyTheme(t.key); open = false"
        >
          <span class="flex shrink-0 -space-x-1.5" aria-hidden="true">
            <span class="h-4 w-4 rounded-full border border-white/20" :style="{ background: t.swatch.bg }"></span>
            <span class="h-4 w-4 rounded-full border border-white/20" :style="{ background: t.swatch.primary }"></span>
            <span class="h-4 w-4 rounded-full border border-white/20" :style="{ background: t.swatch.accent }"></span>
          </span>
          <span class="min-w-0">
            <span class="block text-sm" :class="current === t.key ? 'text-primary' : 'text-text'">{{ t.label }}</span>
            <span class="block truncate text-[10px] text-text-muted/60">{{ t.hint }}</span>
          </span>
          <span v-if="current === t.key" class="ml-auto text-xs text-primary" aria-hidden="true">✓</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.pop-enter-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pop-leave-active {
  transition: opacity 0.15s ease;
}
.pop-enter-from {
  opacity: 0;
  transform: translateY(-4px) scale(0.97);
}
.pop-leave-to {
  opacity: 0;
}
</style>
