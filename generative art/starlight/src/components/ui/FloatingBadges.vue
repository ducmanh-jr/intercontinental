<template>
  <div aria-hidden="true" class="pointer-events-none absolute inset-0 z-0 hidden md:block">
    <div class="absolute right-4 top-16 w-40 -rotate-6 rounded-lg border border-white/10 bg-surface/70 p-3 opacity-70 backdrop-blur" style="z-index:1">
      <p class="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">Achievement</p>
      <p class="mt-1 text-xs font-semibold">蓝桥杯</p>
      <p class="text-[11px] text-text-muted">C++ B 组 · 国二 · 2026.06</p>
    </div>
    <div class="absolute right-16 top-64 w-44 rotate-3 rounded-lg border border-white/10 bg-surface/70 p-2 opacity-70 backdrop-blur" style="z-index:1">
      <img :src="`${base}projects/2048-arena.webp`" alt="" loading="lazy" class="rounded-md" />
    </div>
    <div class="absolute right-0 top-[26rem] w-44 -rotate-2 rounded-lg border border-white/10 bg-surface/70 p-2 opacity-70 backdrop-blur" style="z-index:1">
      <img :src="`${base}projects/art-style-transfer.webp`" alt="" loading="lazy" class="rounded-md" />
    </div>
  </div>
</template>

<script setup lang="ts">
const base = import.meta.env.BASE_URL
</script>
