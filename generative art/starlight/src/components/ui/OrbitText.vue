<script setup lang="ts">
// 旋转轨道文字（v1.6）：SVG textPath 沿圆环排布 + 缓慢自转，hero 装饰
const props = withDefaults(defineProps<{ text?: string }>(), {
  text: 'STARLIGHT ✦ PORTFOLIO ✦ CODING AMONG THE STARS ✦ ',
})
const id = `orbit-${Math.random().toString(36).slice(2, 8)}`
</script>

<template>
  <div class="orbit-text pointer-events-none" aria-hidden="true">
    <svg viewBox="0 0 200 200" class="h-36 w-36 md:h-44 md:w-44">
      <defs>
        <path
          :id="id"
          d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"
          fill="none"
        />
      </defs>
      <text class="fill-text-muted/50 font-mono text-[10.5px] tracking-[0.32em]">
        <textPath :href="`#${id}`">{{ props.text }}</textPath>
      </text>
      <circle cx="100" cy="100" r="6" fill="none" stroke="url(#orbitGrad)" stroke-width="1" opacity="0.5" />
      <defs>
        <linearGradient id="orbitGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style="stop-color: var(--color-primary)" />
          <stop offset="1" style="stop-color: var(--color-accent)" />
        </linearGradient>
      </defs>
    </svg>
  </div>
</template>

<style scoped>
.orbit-text {
  animation: orbit-spin 36s linear infinite;
}
@keyframes orbit-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .orbit-text {
    animation: none;
  }
}
</style>
