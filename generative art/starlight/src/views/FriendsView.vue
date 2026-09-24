<script setup lang="ts">
import { computed, ref } from 'vue'
import { friends, friendExchangeNote } from '@/data/friends'
import { profile } from '@/data/profile'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import { useGsapReveal } from '@/composables/useGsapReveal'

const scopeRef = ref<HTMLElement | null>(null)
useGsapReveal(scopeRef)

// 友邻星轨（v1.7 起步，v2.12 全员入轨）：内圈 3 颗顺时针、外圈其余全部逆时针公转，
// 轨道灯塔与下方卡片列表一一对应；星标本体反向自转保持朝上。
// md 以下不渲染轨道（直接展示卡片列表）；reduced-motion 时轨道静止。
const innerRing = computed(() => friends.slice(0, 3))
const outerRing = computed(() => friends.slice(3))
const email = profile.socials.find((s) => s.label === '邮箱')?.url ?? ''
</script>

<template>
  <section ref="scopeRef" class="section-container relative min-h-[60vh]">
    <SectionTitle
      over="Friends"
      title="友邻星轨"
      as="h1"
      subtitle="星港之外的灯塔——内圈是我的常用航线，外圈是朋友们的站点"
    />

    <!-- 轨道视图：中央恒星 + 双圈公转的友邻站点（内圈 3 + 外圈 6，与下方列表一一对应） -->
    <div data-reveal class="mt-10 hidden justify-center md:flex" aria-hidden="true">
      <div class="relative h-[480px] w-[480px]">
        <!-- 中央恒星 -->
        <div class="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center">
          <span class="glow-text font-mono text-2xl font-bold tracking-[0.2em]">STARLIGHT</span>
          <p class="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/60">中央恒星</p>
        </div>

        <!-- 内圈轨道（顺时针） -->
        <div class="orbit-ring absolute inset-[70px] rounded-full border border-primary/20">
          <div class="orbit-spin absolute inset-0" style="animation-duration: 64s">
            <a
              v-for="(f, i) in innerRing"
              :key="f.name"
              :href="f.url"
              target="_blank"
              rel="noopener"
              class="absolute left-1/2 top-1/2" tabindex="-1"
              :style="{ transform: `rotate(${(360 / innerRing.length) * i}deg) translateY(-170px)` }"
            >
              <!-- 三层抵消：seat 定角度半径 → counter 反公转 → upright 抵消 seat 的静态角度 -->
              <span class="orbit-counter block" style="animation-duration: 64s">
                <span class="block" :style="{ transform: `rotate(${(-360 / innerRing.length) * i}deg)` }">
                  <span
                    class="flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/40 bg-bg/80 text-xl text-primary glow-orbit-primary backdrop-blur transition-all hover:scale-110 hover:border-primary hover:text-accent"
                  >
                    {{ f.mark }}
                  </span>
                </span>
              </span>
            </a>
          </div>
        </div>

        <!-- 外圈轨道（逆时针）：外圈 6 座，偏移 30° 错开内圈灯塔 -->
        <div class="absolute inset-0 rounded-full border border-accent/15">
          <div class="orbit-spin-rev absolute inset-0" style="animation-duration: 96s">
            <a
              v-for="(f, i) in outerRing"
              :key="f.name"
              :href="f.url"
              target="_blank"
              rel="noopener"
              class="absolute left-1/2 top-1/2" tabindex="-1"
              :style="{ transform: `rotate(${(360 / outerRing.length) * i + 30}deg) translateY(-240px)` }"
            >
              <span class="orbit-counter-rev block" style="animation-duration: 96s">
                <span class="block" :style="{ transform: `rotate(${(-360 / outerRing.length) * i - 30}deg)` }">
                  <span
                    class="flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-accent/40 bg-bg/80 text-xl text-accent glow-orbit-accent backdrop-blur transition-all hover:scale-110 hover:border-accent hover:text-primary"
                  >
                    {{ f.mark }}
                  </span>
                </span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- 可访问列表：轨道之外，友邻信息一并列出（移动端唯一视图） -->
    <div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <a
        v-for="f in friends"
        :key="f.name"
        data-reveal
        :href="f.url"
        target="_blank"
        rel="noopener"
        class="card group flex min-w-0 items-center gap-4 p-5 transition-[transform,border-color] duration-300 hover:-translate-y-1"
      >
        <span
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 text-lg transition-all group-hover:border-primary/50 group-hover:text-primary"
          aria-hidden="true"
          >{{ f.mark }}</span
        >
        <span class="min-w-0">
          <span class="block truncate font-semibold transition-colors group-hover:text-primary">{{ f.name }}</span>
          <span class="mt-0.5 block truncate text-sm text-text-muted">{{ f.desc }}</span>
        </span>
        <span
          aria-hidden="true"
          class="ml-auto shrink-0 text-text-muted/40 transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary"
          >↗</span
        >
      </a>
    </div>

    <!-- 交换友链 -->
    <div data-reveal class="card mt-10 flex flex-col items-start gap-3 border-dashed p-6 md:flex-row md:items-center">
      <span class="text-2xl" aria-hidden="true">🛰️</span>
      <p class="flex-1 text-sm leading-6 text-text-muted">{{ friendExchangeNote }}</p>
      <a :href="email" class="btn-primary shrink-0 !px-4 !py-2 text-xs">发送联络信号</a>
    </div>
  </section>
</template>

<style scoped>
/* 公转：整圈旋转；seat 用静态 transform 定角度+半径，counter 反向公转，最内层再抵消静态角度 */
@keyframes orbit-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.orbit-spin {
  animation-name: orbit-rotate;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
.orbit-spin-rev {
  animation-name: orbit-rotate;
  animation-direction: reverse;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
.orbit-counter {
  animation-name: orbit-rotate;
  animation-direction: reverse;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
.orbit-counter-rev {
  animation-name: orbit-rotate;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
@media (prefers-reduced-motion: reduce) {
  .orbit-spin,
  .orbit-spin-rev,
  .orbit-counter,
  .orbit-counter-rev {
    animation: none;
  }
}
</style>
