<script setup lang="ts">
import { loadingState } from '@/stores/loading'
</script>

<template>
  <Transition name="fade">
    <div
      v-if="loadingState.navigating"
      class="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden"
      aria-hidden="true"
    >
      <div class="loading-bar-inner h-full w-1/3 bg-gradient-to-r from-primary to-accent"></div>
    </div>
  </Transition>
</template>

<style scoped>
.loading-bar-inner {
  animation: loading-slide 1s ease-in-out infinite;
}
@keyframes loading-slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(400%);
  }
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .loading-bar-inner {
    animation: none;
  }
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
