<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

type GsapApi = (typeof import('gsap'))['default']
type GsapCtx = gsap.Context

const props = withDefaults(defineProps<{ text: string; class?: string }>(), { class: '' })
const rootRef = ref<HTMLElement | null>(null)
let gsap: GsapApi | null = null
let ctx: GsapCtx | null = null
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!rootRef.value) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) return // 直接呈现终态
  void (async () => {
    gsap ??= (await import('gsap')).default
    if (!rootRef.value) return // await 期间组件卸载
    ctx = gsap.context(() => {
      const chars = rootRef.value!.querySelectorAll('.eh-char')
      gsap!.set(chars, {
        opacity: 0,
        yPercent: () => gsap!.utils.random(-220, 220),
        rotation: () => gsap!.utils.random(-28, 28),
      })
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            observer?.disconnect()
            gsap!.to(chars, {
              opacity: 1,
              yPercent: 0,
              rotation: 0,
              duration: 0.7,
              ease: 'elastic.out(1.1, 0.5)',
              stagger: 0.035,
            })
          }
        },
        { threshold: 0.3 },
      )
      observer.observe(rootRef.value!)
    }, rootRef.value)
  })()
})
onUnmounted(() => {
  observer?.disconnect()
  ctx?.revert()
})
</script>

<template>
  <p ref="rootRef" :class="props.class" role="text" :aria-label="text">
    <span v-for="(ch, i) in text.split('')" :key="i" class="eh-char inline-block will-change-transform" aria-hidden="true">
      {{ ch }}
    </span>
  </p>
</template>
