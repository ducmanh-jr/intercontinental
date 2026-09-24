<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Project } from '@/data/projects'
import { useInertiaTilt } from '@/composables/useInertiaTilt'

const BASE_URL = import.meta.env.BASE_URL

defineProps<{ project: Project }>()

// 磁吸惯性：transform 加在 article 上，不干扰卡片内链接/按钮点击
const cardEl = ref<HTMLElement | null>(null)
const { attach } = useInertiaTilt(cardEl)
onMounted(attach)
</script>

<template>
  <article
    ref="cardEl"
    data-reveal
    class="card group relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
  >
    <span
      class="absolute inset-y-0 left-0 z-10 w-[3px]"
      :class="project.status === 'active' ? 'bg-gradient-to-b from-primary to-accent' : 'bg-white/15'"
    ></span>
    <!-- 右上角光晕：hover 时点亮 -->
    <span
      aria-hidden="true"
      class="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-opacity duration-500 group-hover:bg-accent/20"
    ></span>
    <div v-if="project.image" class="relative aspect-video overflow-hidden bg-surface">
      <img
        :src="`${BASE_URL}projects/${project.image}`"
        :alt="project.title"
        width="640"
        height="360"
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
      />
      <!-- 底部渐变：让 over 标签贴在图上更清晰 -->
      <span
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg/80 to-transparent"
      ></span>
      <span
        v-if="project.over"
        class="absolute left-3 top-3 rounded-sm bg-bg/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-primary backdrop-blur-sm"
        >{{ project.over }}</span
      >
      <span
        class="absolute right-3 top-3 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-widest backdrop-blur-sm"
        :class="
          project.status === 'active'
            ? 'border-primary/40 bg-primary/10 text-primary'
            : 'border-white/15 bg-bg/60 text-text-muted'
        "
        >{{ project.status === 'active' ? '● 航行中' : '✓ 已归航' }}</span
      >
    </div>
    <div class="flex flex-1 flex-col p-6">
      <h2 class="flex items-baseline gap-2 text-lg font-semibold md:text-xl">
        <span class="transition-colors duration-200 group-hover:text-primary">{{ project.title }}</span>
        <span
          aria-hidden="true"
          class="font-mono text-sm text-primary opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
          >↗</span
        >
      </h2>
      <p class="mt-2 line-clamp-4 text-sm leading-6 text-text-muted">{{ project.description }}</p>
      <ul class="mt-4 flex flex-wrap gap-2">
        <li
          v-for="tag in project.tags"
          :key="tag"
          :title="tag"
          class="rounded-full border border-white/10 bg-white/[0.02] text-text-muted transition-colors group-hover:border-white/15"
          :class="[
            project.tags.length <= 3 ? 'px-3 py-1 text-xs' : 'px-2.5 py-0.5 text-[11px]',
            tag.length > 14 ? 'max-w-[10rem] truncate' : '',
          ]"
        >
          <span class="mr-1 text-[9px] text-primary/70" aria-hidden="true">✦</span>{{ tag }}
        </li>
      </ul>
      <div class="mt-auto flex gap-5 pt-5 text-sm">
        <a
          v-if="project.github"
          :href="project.github"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-1.5 text-primary transition-opacity hover:opacity-80"
        >
          <svg viewBox="0 0 16 16" class="h-4 w-4 fill-current" aria-hidden="true">
            <path
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
            />
          </svg>
          GitHub
        </a>
        <!-- 站内演示（demo 以 / 开头）走 SPA 路由，内嵌浏览器也能用；外链开新标签 -->
        <RouterLink
          v-if="project.demo && project.demo.startsWith('/')"
          :to="project.demo"
          class="inline-flex items-center gap-1 text-text-muted transition-colors hover:text-text"
        >
          在线参观
          <span aria-hidden="true">→</span>
        </RouterLink>
        <a
          v-else-if="project.demo"
          :href="project.demo"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-1 text-text-muted transition-colors hover:text-text"
        >
          在线演示
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  </article>
</template>
