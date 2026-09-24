<script setup lang="ts">
import { profile } from '@/data/profile'

const socials = profile.socials
</script>

<template>
  <footer class="relative z-10 border-t border-white/10">
    <div class="mx-auto max-w-5xl px-6 py-12">
      <div class="grid gap-10 md:grid-cols-[1fr_auto]">
        <div>
          <p class="glow-text font-mono text-lg font-bold">STARLIGHT</p>
          <p class="mt-2 text-sm text-text-muted">用 Vue 3 + Three.js + GSAP 构建 · 记录代码与思考</p>
        </div>
        <div class="flex gap-12 text-sm">
          <ul class="space-y-2">
            <li class="font-mono text-xs uppercase tracking-[0.25em] text-text-muted/70">导航</li>
            <li><RouterLink to="/" class="text-text-muted hover:text-text">首页</RouterLink></li>
            <li><RouterLink to="/projects" class="text-text-muted hover:text-text">项目</RouterLink></li>
            <li><RouterLink to="/blog" class="text-text-muted hover:text-text">博客</RouterLink></li>
          </ul>
          <ul class="space-y-2">
            <li class="font-mono text-xs uppercase tracking-[0.25em] text-text-muted/70">联系</li>
            <li v-for="s in socials" :key="s.label">
              <a
                :href="s.url"
                class="text-text-muted hover:text-text"
                :target="s.url.startsWith('mailto:') ? undefined : '_blank'"
                :rel="s.url.startsWith('mailto:') ? undefined : 'noopener'"
                >{{ s.label }}</a
              >
            </li>
          </ul>
        </div>
      </div>
      <div
        class="mt-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-text-muted"
      >
        <p>© {{ new Date().getFullYear() }} xrk-hhh · 按 ? 查看快捷键</p>
        <!-- 当前站点版本号（写死）：发版时需同步更新 VersionArchiveView 的 versions 数组与 index.html 的 STELLAR MAP 注释 -->
        <RouterLink to="/versions" class="font-mono text-text-muted/70 hover:text-primary"
          >v1.4.0</RouterLink
        >
      </div>
    </div>
  </footer>
</template>
