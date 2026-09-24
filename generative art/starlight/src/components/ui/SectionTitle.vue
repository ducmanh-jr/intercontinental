<script setup lang="ts">
withDefaults(
  defineProps<{ title: string; subtitle?: string; over?: string; as?: 'h1' | 'h2' }>(),
  { subtitle: '', over: '', as: 'h2' },
)
</script>

<template>
  <div data-reveal class="mb-12">
    <p
      v-if="over"
      class="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-text-muted/70"
    >
      <span class="inline-block h-1.5 w-1.5 rotate-45 bg-gradient-to-br from-primary to-accent"></span>
      {{ over }}
      <span class="ml-1 h-px flex-1 bg-gradient-to-r from-white/15 to-transparent"></span>
    </p>
    <component :is="as" class="text-2xl font-bold md:text-3xl">{{ title }}</component>
    <!-- 标题下的小星座：渐变短线 + 伴星（v1.7 设计增强） -->
    <div aria-hidden="true" class="mt-3 flex items-center gap-1.5">
      <span class="h-[3px] w-12 rounded-full bg-gradient-to-r from-primary to-accent"></span>
      <span class="h-1 w-1 rounded-full bg-primary/60"></span>
      <span class="h-[3px] w-[1px] bg-white/20"></span>
      <span class="h-1.5 w-1.5 rounded-full bg-accent/60"></span>
    </div>
    <p v-if="subtitle" class="mt-3 text-sm text-text-muted">{{ subtitle }}</p>
  </div>
</template>
