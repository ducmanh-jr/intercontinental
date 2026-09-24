# 个人网站实施计划（Implementation Plan）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从零搭建 Vue3 + Three.js + GSAP 个人网站（首页/关于/项目/博客），部署到 GitHub Pages。

**Architecture:** 四页 vue-router SPA；全局粒子层（App 级 canvas 只挂载一次，密度按路由调整）；内容与组件分离（`src/data/*.ts` + `src/blog/*.md`）；Three.js 场景为纯 TS 类，与 Vue 解耦、成对 init/dispose。

**Tech Stack:** Vue 3 + TypeScript + Vite · Tailwind CSS v4 · Three.js · GSAP 3 · vue-router 4 · markdown-it + shiki + gray-matter · Vitest · GitHub Actions

**上游规格：** 本计划执行 `Plan.md`（§0 执行协议、§9 实施步骤、§10 素材清单均生效）。阶段间设人工检查点，**一次只执行一个阶段**。

## Global Constraints

- 依赖禁令：不引入 Lenis、GLB 模型、音效、Pinia、UI 组件库、TresJS、vite-plugin-glsl、@unhead、webfont 字体。
- 性能预算：首屏 JS（gzip）< 300KB；桌面粒子 ≤ 1000、低密度档 300；**移动端（视口 < 768px）粒子关闭不渲染**；DPR = `Math.min(devicePixelRatio, 2)`；Lighthouse ≥ 90；动画只动 transform/opacity。
- 视觉令牌：背景 `#0a0a12`，主色 cyan `#22d3ee`，点缀 violet `#8b5cf6`，文字 `#f4f4f5` 主 / `#9ca3af` 辅；全站中文。
- 生命周期纪律：Three.js 资源 `scene.traverse()` 递归 dispose + `renderer.dispose()` + `cancelAnimationFrame`；GSAP 动画一律包 `gsap.context(fn, scope)`，卸载时 `ctx.revert()`；IO 进入一次即 `unobserve`。
- 版本管理：git 仓库仅 `main`（部署触发）与 `dev`（日常开发）分支；**禁止直接在 main 开发**；阶段验收通过后 merge。
- 部署：`base: './'`；history 路由；404 回退用 sessionStorage 重定向方案（`pathname.split('/')[1]` 计算仓库根，**禁止 `new URL('.', location.href)`**）。
- 工程细节：`import.meta.glob` 必须 `as: 'raw'`；shader 用 `?raw` 导入；`meta.title`/`meta.particles` 需 RouteMeta 类型扩展；`stores/particles.ts` 是纯 Vue reactive 单例，**非 Pinia**。
- 内容纪律：组件内零硬编码文案；加文章 = 丢 md 文件；改简介 = 改 `data/profile.ts`。
- 库 API 用法不确定时，先跑 `npx ctx7@latest library <库名> "<问题>"` 再 `npx ctx7@latest docs <id> "<问题>"` 核验当前文档（每库最多 3 条命令）。

---

# 阶段 ① 初始化 + 骨架

验收标准（§9）：`npm run dev` 四页可切换；`vue-tsc` 通过 + 人工确认 `npm run dev`/`npm run build` 无报错、视觉走查通过。

### Task 1: 仓库初始化与分支

**Files:**
- Create: `.gitignore`、`.vscode/settings.json`（替换现有的裸 `.vscode` 文件）

**Interfaces:**
- Produces: git 仓库（`main` + `dev` 分支），后续所有任务的 commit 都落在 `dev`

- [ ] **Step 1: 检查 Node 版本**

Run: `node -v`
Expected: ≥ 20.19（Vite 7 要求；若低于此，先升级 Node，Vite 8 需要 ≥ 22——以 ctx7 核验为准）。

- [ ] **Step 2: 迁移裸 `.vscode` 文件为目录**

现有 `D:\cs\Website\.vscode` 是一个无扩展名文件（内容为 settings JSON）。将其迁移为规范目录：

```bash
mkdir .vscode && cat .vscode > .vscode/settings.json && rm .vscode
```

`.vscode/settings.json` 内容（保留原配置，补一行缩进配置）：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

- [ ] **Step 3: 写 .gitignore**

```gitignore
node_modules/
dist/
*.local
.env
.env.*
.DS_Store
.vscode/*
!.vscode/settings.json
```

- [ ] **Step 4: git init 并建 dev 分支**

```bash
git init -b main
git checkout -b dev
```

- [ ] **Step 5: 首提交**

```bash
git add .gitignore .vscode Plan.md Implementation-Plan.md
git commit -m "docs: 项目计划与技术方案（Plan.md + 实施计划）"
```

- [ ] **Step 6:（询问用户后执行）父仓库忽略 Website/**

`D:\cs` 也是 git 仓库。为避免嵌套仓库被误提交，询问用户是否在 `D:\cs\.gitignore` 追加一行 `Website/`；用户同意才改。

### Task 2: 脚手架与核心依赖

**Files:**
- Create: `package.json`、`vite.config.ts`、`tsconfig.json`、`tsconfig.node.json`、`index.html`、`src/main.ts`、`src/App.vue`（最小占位）、`scripts/postbuild.mjs`（完整实现，理由见 Step 4）

**Interfaces:**
- Produces: 可运行的 Vite + Vue + TS 项目；`vite.config.ts` 含 `@` 别名与 `base: './'`

- [ ] **Step 1: 核验 Vite 当前版本与脚手架要求**

Run: `npx ctx7@latest library vite "vue typescript project vite.config.ts base alias setup"`
再用返回的 ID 查 docs，确认当前 Vite 主版本号与 Node 版本要求。

- [ ] **Step 2: 初始化 package.json 并安装依赖**

```bash
npm init -y
npm install vue vue-router three gsap markdown-it gray-matter
npm install -D vite @vitejs/plugin-vue typescript vue-tsc tailwindcss @tailwindcss/vite @types/three @types/markdown-it
```

（shiki 在阶段③ Task 16 安装——它体积大，且只有博客详情页用。）

- [ ] **Step 3: 写 package.json scripts（补充 14）**

安装后编辑 `package.json`：

```json
{
  "name": "portfolio",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "postbuild": "node scripts/postbuild.mjs"
  }
}
```

注意：`postbuild` 会在每次 `npm run build` 后自动执行。

- [ ] **Step 4: 写 scripts/postbuild.mjs（完整实现，防止 ①-③ 阶段 build 因缺文件挂掉）**

补充 13 要求脚本在阶段④测试，但 scripts 入口阶段①就位。二者取兼容解：阶段①写入完整实现（代码已定稿），阶段④做联调验证：

```js
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'

copyFileSync('dist/index.html', 'dist/404.html')

const redirectScript = `<script>
  (function () {
    var segments = location.pathname.split('/');
    var repo = segments[1] || '';
    var root = repo ? '/' + repo + '/' : '/';
    sessionStorage.redirect = location.href;
    location.replace(root);
  })();
</script>`

const html = readFileSync('dist/404.html', 'utf-8')
  .replace('<head>', '<head>' + redirectScript)

writeFileSync('dist/404.html', html)
```

- [ ] **Step 5: 写 vite.config.ts**

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: './',
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
```

- [ ] **Step 6: 写 tsconfig.json 与 tsconfig.node.json**

`tsconfig.json`（根，solution 形态）：

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

`tsconfig.app.json`：

```json
{
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["vite/client"],
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"]
}
```

`tsconfig.node.json`：

```json
{
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "noEmit": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["node"],
    "skipLibCheck": true
  },
  "include": ["vite.config.ts"]
}
```

> **T2 实施时修正（2026-08-13）**：原计划写的是 `vue-tsc --noEmit` + 根 tsconfig 仅引用 node——实测该形态下 vue-tsc **不检查 src**（类型门失效）。改为官方模板形态：根引用 app+node 两个工程、`vue-tsc -b` 构建模式、两工程 `composite: true`。同时 `typescript` 需固定 `^5.9.3`（npm 的 typescript@latest 已是 7.x，与 vue-tsc 不兼容）。

（`types: ["vite/client"]` 使 `?raw` 导入有类型，对应补充 8；安装 `@types/node` 供 tsconfig.node.json 使用：`npm i -D @types/node`。）

- [ ] **Step 7: 写 index.html**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="个人网站：前端开发、算法与生活。" />
    <meta name="theme-color" content="#0a0a12" />
    <meta property="og:title" content="个人网站" />
    <meta property="og:description" content="前端开发、算法与生活。" />
    <title>个人网站</title>
    <style>
      html { background: #0a0a12; }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 8: 写最小 src/main.ts 与 src/App.vue**

`src/main.ts`：

```ts
import { createApp } from 'vue'
import App from './App.vue'
import './styles/main.css'

createApp(App).mount('#app')
```

`src/App.vue`（最小占位，Task 4 改造）：

```vue
<template>
  <div class="min-h-screen text-white">骨架</div>
</template>
```

- [ ] **Step 9: 验证构建**

Run: `npm run build`
Expected: 构建成功（postbuild 无报错，`dist/404.html` 已生成）。

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: vite+vue+ts 脚手架、tailwind 插件、依赖与构建脚本"
```

### Task 3: Tailwind 4 设计令牌与全局样式

**Files:**
- Create: `src/styles/main.css`

**Interfaces:**
- Produces: 全局 CSS 令牌（颜色/字体）与组件复用类，供所有后续任务使用

- [ ] **Step 1: 核验 Tailwind 4 CSS-first 配置写法**

Run: `npx ctx7@latest library tailwindcss "tailwind v4 vite plugin @theme custom colors setup"`

- [ ] **Step 2: 写 src/styles/main.css**

```css
@import "tailwindcss";

@theme {
  --color-bg: #0a0a12;
  --color-surface: #12121e;
  --color-primary: #22d3ee;
  --color-accent: #8b5cf6;
  --color-text: #f4f4f5;
  --color-text-muted: #9ca3af;
  --font-sans: "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Consolas, monospace;
}

@layer base {
  html {
    background: var(--color-bg);
  }
  body {
    @apply text-text font-sans antialiased;
    /* 静态环境光渐变：WebGL 不可用时的回退背景（§5.3），粒子层正常时被 canvas 覆盖。
       注意：渐变必须在 body 上（T3 审查发现：body 的不透明背景会盖住 html 上的渐变） */
    background:
      radial-gradient(ellipse at 30% 20%, rgba(34, 211, 238, 0.08), transparent 60%),
      radial-gradient(ellipse at 70% 80%, rgba(139, 92, 246, 0.08), transparent 60%),
      var(--color-bg);
  }
  ::selection {
    background: color-mix(in oklab, var(--color-primary) 30%, transparent);
  }
}

@layer components {
  .section-container {
    @apply mx-auto w-full max-w-5xl px-6 py-24;
  }
  .card {
    @apply rounded-xl border border-white/10 bg-surface/80;
  }
  .glow-text {
    background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .btn-primary {
    @apply inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium
      transition-opacity duration-200;
    background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
    color: #0a0a12;
  }
  .btn-primary:hover {
    opacity: 0.85;
  }
}
```

- [ ] **Step 3: 验证令牌生效**

临时在 `App.vue` 模板写 `<h1 class="glow-text">测试</h1>`，Run: `npm run dev`，确认渐变文字渲染；随后删掉测试行。

- [ ] **Step 4: Commit**

```bash
git add src/styles/main.css src/App.vue
git commit -m "style: tailwind4 设计令牌与全局样式"
```

### Task 4: 路由骨架、布局与 SEO

**Files:**
- Create: `src/types/router.d.ts`、`src/router/index.ts`、`src/components/layout/AppNav.vue`、`src/components/layout/AppFooter.vue`、`src/views/HomeView.vue`、`src/views/AboutView.vue`、`src/views/ProjectsView.vue`、`src/views/BlogListView.vue`、`src/views/BlogPostView.vue`
- Modify: `src/App.vue`

**Interfaces:**
- Produces:
  - `RouteMeta`：`{ title?: string; particles?: 'high' | 'low' | 'off' }`（Task 8 起 `particles` 类型改为从 stores 导入）
  - 5 条路由：`/`、`/about`、`/projects`、`/blog`、`/blog/:slug`，全部懒加载

- [ ] **Step 1: 写 RouteMeta 类型扩展（补充 10）**

`src/types/router.d.ts`：

```ts
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    particles?: 'high' | 'low' | 'off'
  }
}
```

- [ ] **Step 2: 写路由（含 §4.4 SEO 标题逻辑）**

`src/router/index.ts`：

```ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: '首页', particles: 'high' },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
      meta: { title: '关于', particles: 'low' },
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/views/ProjectsView.vue'),
      meta: { title: '项目', particles: 'low' },
    },
    {
      path: '/blog',
      name: 'blog',
      component: () => import('@/views/BlogListView.vue'),
      meta: { title: '博客', particles: 'low' },
    },
    {
      path: '/blog/:slug',
      name: 'blog-post',
      component: () => import('@/views/BlogPostView.vue'),
      meta: { title: '文章', particles: 'off' },
    },
  ],
})

router.afterEach((to) => {
  const siteName = '个人网站'
  document.title = to.meta.title ? `${to.meta.title} | ${siteName}` : siteName
})

export default router
```

- [ ] **Step 3: 改造 App.vue（布局 + 页面切换过渡）**

```vue
<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppNav from '@/components/layout/AppNav.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
</script>

<template>
  <div class="relative min-h-screen">
    <AppNav />
    <main class="relative z-10">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <AppFooter />
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
}
</style>
```

（注意：全局粒子层 `ParticleBackground` 在阶段② Task 10 才接入，这里先留位置。）

- [ ] **Step 4: 写导航（毛玻璃效果）**

`src/components/layout/AppNav.vue`：

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const scrolled = ref(false)
function onScroll() {
  scrolled.value = window.scrollY > 50
}
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

const links = [
  { to: '/', label: '首页' },
  { to: '/about', label: '关于' },
  { to: '/projects', label: '项目' },
  { to: '/blog', label: '博客' },
]
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-50 transition-colors duration-300"
    :class="scrolled ? 'border-b border-white/10 bg-bg/80 backdrop-blur' : ''"
  >
    <nav class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
      <RouterLink to="/" class="glow-text font-mono text-lg font-bold">LOGO</RouterLink>
      <ul class="flex items-center gap-6 text-sm text-text-muted">
        <li v-for="link in links" :key="link.to">
          <RouterLink
            :to="link.to"
            class="transition-colors hover:text-text"
            active-class="text-text"
            exact-active-class="text-text"
            >{{ link.label }}</RouterLink
          >
        </li>
      </ul>
    </nav>
  </header>
</template>
```

- [ ] **Step 5: 写页脚**

`src/components/layout/AppFooter.vue`：

```vue
<template>
  <footer class="relative z-10 border-t border-white/10 py-8">
    <p class="text-center text-sm text-text-muted">
      © {{ new Date().getFullYear() }} · 用 Vue 3 + Three.js + GSAP 构建
    </p>
  </footer>
</template>
```

- [ ] **Step 6: 写 5 个占位视图**

`src/views/HomeView.vue`（其余四个视图同构，标题换文案）：

```vue
<template>
  <section class="section-container flex min-h-screen items-center">
    <h1 class="text-4xl font-bold">首页（阶段③填充真实内容）</h1>
  </section>
</template>
```

占位文案：AboutView「关于」、ProjectsView「项目」、BlogListView「博客」、BlogPostView「文章（slug：{{ $route.params.slug }}）」。

- [ ] **Step 7: 验证**

Run: `npm run build`
Expected: `vue-tsc` 通过、构建成功。`npm run dev` 手点导航四页可切换、标题随路由变化（`首页 | 个人网站` 等）。

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: 路由骨架、导航/页脚布局与 SEO 标题"
```

### Task 5: 数据层（占位数据 + 类型）

**Files:**
- Create: `src/data/profile.ts`、`src/data/projects.ts`

**Interfaces:**
- Produces:
  ```ts
  // src/data/profile.ts
  export interface Skill { name: string; level: '熟练' | '了解' }
  export interface SocialLink { label: string; url: string }
  export const profile: {
    name: string
    title: string
    introShort: string
    introLong: string
    avatar: string
    skills: Skill[]
    socials: SocialLink[]
  }
  // src/data/projects.ts
  export interface Project {
    slug: string
    title: string
    description: string
    tags: string[]
    image?: string
    github?: string
    demo?: string
    featured?: boolean
  }
  export const projects: Project[]
  ```
  消费方：Task 11（Hero 文案）、Task 14/15（关于页、项目页）。

- [ ] **Step 1: 写 src/data/profile.ts**

```ts
export interface Skill {
  name: string
  level: '熟练' | '了解'
}

export interface SocialLink {
  label: string
  url: string
}

export const profile = {
  name: '占位名字',
  title: '全栈开发 / 算法爱好者',
  introShort: '一句话简介（阶段③替换为真实内容）',
  introLong:
    '这里是详细简介占位文本。阶段③准备素材后替换。',
  avatar: `${import.meta.env.BASE_URL}images/avatar.webp`,
  skills: [
    { name: 'Vue 3', level: '熟练' },
    { name: 'TypeScript', level: '熟练' },
    { name: 'C++ / 算法', level: '熟练' },
    { name: 'Three.js', level: '了解' },
  ] as Skill[],
  socials: [{ label: 'GitHub', url: 'https://github.com/' }] as SocialLink[],
} satisfies {
  name: string
  title: string
  introShort: string
  introLong: string
  avatar: string
  skills: Skill[]
  socials: SocialLink[]
}
```

（`satisfies` 只校验不加宽类型，后续消费处能拿到字面量级联推断。头像路径注意：`BASE_URL` 为 `./`，相对路径仅在**顶层路由**（`/`、`/about`、`/projects`）下正确；博客详情等嵌套路由上不使用头像，若将来需要，改为 `src/assets/` 导入方式。）

- [ ] **Step 2: 写 src/data/projects.ts**

```ts
export interface Project {
  slug: string
  title: string
  description: string
  tags: string[]
  image?: string
  github?: string
  demo?: string
  featured?: boolean
}

export const projects: Project[] = [
  {
    slug: 'portfolio',
    title: '本网站',
    description: '占位项目：Vue 3 + Three.js + GSAP 个人网站（阶段③替换为真实项目）。',
    tags: ['Vue 3', 'TypeScript', 'Three.js'],
    featured: true,
  },
]
```

- [ ] **Step 3: Commit**

```bash
git add src/data
git commit -m "feat: 数据层占位结构与类型定义"
```

### Task 6: 博客数据管道 lib/blog.ts（TDD）

**Files:**
- Create: `src/lib/blog.ts`、`src/lib/blog.test.ts`、`src/blog/2026-08-13-hello.md`（示例文章）
- Modify: `vite.config.ts`（加 vitest 配置）、`package.json`（加 `test` script）

**Interfaces:**
- Consumes: 无（独立）
- Produces:
  ```ts
  export interface BlogMeta {
    slug: string
    title: string
    date: string        // 'YYYY-MM-DD'
    tags: string[]
    desc: string
    content: string     // frontmatter 之后的 markdown 正文
  }
  export function parseBlogPost(raw: string, slug: string): BlogMeta
  export function listPosts(modules: Record<string, string>): BlogMeta[]  // 按 date 倒序
  ```
  消费方：Task 16（博客列表/详情页）。

- [ ] **Step 1: 安装 vitest 并配置**

```bash
npm i -D vitest
```

`package.json` scripts 增加：`"test": "vitest run"`。
`vite.config.ts` 顶部改为 `import { defineConfig } from 'vitest/config'`，追加：

```ts
export default defineConfig({
  // ...原有配置
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 2: 写失败测试**

`src/lib/blog.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { parseBlogPost, listPosts } from './blog'

const sample = `---
title: 你好，世界
date: 2026-08-13
tags: [生活]
desc: 第一篇博客
---

# 正文

内容。`

describe('parseBlogPost', () => {
  it('解析 frontmatter 与正文', () => {
    const post = parseBlogPost(sample, '2026-08-13-hello')
    expect(post.slug).toBe('2026-08-13-hello')
    expect(post.title).toBe('你好，世界')
    expect(post.date).toBe('2026-08-13')
    expect(post.tags).toEqual(['生活'])
    expect(post.desc).toBe('第一篇博客')
    expect(post.content).toContain('# 正文')
  })

  it('缺少 title 时抛出错误', () => {
    const bad = `---\ndate: 2026-08-13\n---\n正文`
    expect(() => parseBlogPost(bad, 'x')).toThrow(/title/)
  })
})

describe('listPosts', () => {
  it('按 date 倒序排列', () => {
    const posts = listPosts({
      'a.md': sample,
      'b.md': `---\ntitle: 更早\ndate: 2025-01-01\ndesc: 二\n---\n`,
    })
    expect(posts.map((p) => p.date)).toEqual(['2026-08-13', '2025-01-01'])
  })
})
```

- [ ] **Step 3: 运行测试确认失败**

Run: `npm test`
Expected: FAIL（`Cannot find module './blog'`）

- [ ] **Step 4: 实现 src/lib/blog.ts**

```ts
import matter from 'gray-matter'

export interface BlogMeta {
  slug: string
  title: string
  date: string
  tags: string[]
  desc: string
  content: string
}

export function parseBlogPost(raw: string, slug: string): BlogMeta {
  const { data, content } = matter(raw)
  if (typeof data.title !== 'string' || !data.title) {
    throw new Error(`[blog] ${slug}: frontmatter 缺少 title`)
  }
  if (typeof data.date !== 'string' && !(data.date instanceof Date)) {
    throw new Error(`[blog] ${slug}: frontmatter 缺少 date`)
  }
  const date =
    data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date)
  return {
    slug,
    title: data.title,
    date,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    desc: typeof data.desc === 'string' ? data.desc : '',
    content,
  }
}

export function listPosts(modules: Record<string, string>): BlogMeta[] {
  return Object.entries(modules)
    .map(([path, raw]) => {
      const slug = path.split('/').pop()!.replace(/\.md$/, '')
      return parseBlogPost(raw, slug)
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

// TODO（性能扩展点，Plan §7）：文章数超过 15 篇时，
// 评估 shiki 构建时预编译或按需加载渲染依赖。
export const blogModules = import.meta.glob('../blog/*.md', {
  as: 'raw',
  eager: true,
}) as Record<string, string>
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test`
Expected: PASS（2 个 describe 全绿）

- [ ] **Step 6: 写示例文章 src/blog/2026-08-13-hello.md**

```markdown
---
title: 你好，世界
date: 2026-08-13
tags: [生活]
desc: 第一篇博客文章
---

# 你好，世界

这是博客的第一篇文章。
```

- [ ] **Step 7: 验证类型与构建**

Run: `npm run build`
Expected: 通过（glob 以 `as: 'raw'` 收集 md，不报模块解析错）

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: 博客数据管道（glob+frontmatter 解析，TDD）"
```

### Task 7: ESLint / Prettier 与阶段①验收

**Files:**
- Create: `eslint.config.js`、`.prettierrc`

- [ ] **Step 1: 安装**

```bash
npm i -D eslint @eslint/js eslint-plugin-vue typescript-eslint eslint-config-prettier prettier
```

- [ ] **Step 2: 写 eslint.config.js（flat config）**

```js
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },
  eslintConfigPrettier,
)
```

- [ ] **Step 3: 写 .prettierrc**

```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 100
}
```

- [ ] **Step 4: package.json 增加 lint script**

`"lint": "eslint src --ext .ts,.vue"`

- [ ] **Step 5: 全量检查**

Run: `npm run lint && npm test && npm run build`
Expected: 全绿（如有既有告警当场修复）。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: eslint/prettier 工程化配置"
```

- [ ] **Step 7: 阶段①验收清单（对照 §9 + 执行协议）**

输出以下清单请用户逐项确认：
1. `npm run dev` 四页可切换、导航毛玻璃生效、页面标题随路由变化 ✅/❌
2. `npm run build` 无报错（vue-tsc + vite + postbuild）✅/❌
3. `npm test` 全绿 ✅/❌
4. `npm run lint` 无告警 ✅/❌
5. 视觉走查：深色背景 `#0a0a12`、渐变 `glow-text` 文字渲染正确 ✅/❌

用户确认通过后进入阶段②。

---

# 阶段 ② 粒子 + 动画

验收标准（§9）：桌面 60fps；路由切换无泄漏（Performance 面板无累积）；移动端降级生效 + 人工检查点。

### Task 8: 粒子状态单例 stores/particles.ts（TDD）

**Files:**
- Create: `src/stores/particles.ts`、`src/stores/particles.test.ts`
- Modify: `src/types/router.d.ts`（`particles` 类型改为从 stores 导入）

**Interfaces:**
- Produces:
  ```ts
  export type ParticleDensity = 'high' | 'low' | 'off'
  export const particlesState: { density: ParticleDensity }   // reactive
  export function resolveParticleCount(density: ParticleDensity, isMobile: boolean): number
  ```
  消费方：Task 9（ParticleScene 计数）、Task 10（ParticleBackground）、路由 afterEach（写 `particlesState.density`）

- [ ] **Step 1: 写失败测试**

`src/stores/particles.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { resolveParticleCount } from './particles'

describe('resolveParticleCount', () => {
  it('移动端一律为 0（不渲染）', () => {
    expect(resolveParticleCount('high', true)).toBe(0)
    expect(resolveParticleCount('low', true)).toBe(0)
  })
  it('桌面档位映射', () => {
    expect(resolveParticleCount('high', false)).toBe(1000)
    expect(resolveParticleCount('low', false)).toBe(300)
    expect(resolveParticleCount('off', false)).toBe(0)
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `npm test`
Expected: FAIL

- [ ] **Step 3: 实现 src/stores/particles.ts**

```ts
import { reactive } from 'vue'

export type ParticleDensity = 'high' | 'low' | 'off'

// 纯 Vue reactive 单例（非 Pinia），由 router.afterEach 写入
export const particlesState = reactive({
  density: 'low' as ParticleDensity,
})

const DENSITY_COUNT: Record<ParticleDensity, number> = {
  high: 1000,
  low: 300,
  off: 0,
}

export function resolveParticleCount(density: ParticleDensity, isMobile: boolean): number {
  if (isMobile) return 0
  return DENSITY_COUNT[density]
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: 更新 RouteMeta 类型与路由**

`src/types/router.d.ts` 改为：

```ts
import 'vue-router'
import type { ParticleDensity } from '@/stores/particles'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    particles?: ParticleDensity
  }
}
```

`src/router/index.ts` 的 afterEach 追加：

```ts
import { particlesState } from '@/stores/particles'
// afterEach 内：
particlesState.density = to.meta.particles ?? 'low'
```

- [ ] **Step 6: 验证类型与测试**

Run: `npm test && npm run build`
Expected: 全绿

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: 粒子密度状态单例（路由驱动，TDD）"
```

### Task 9: ParticleScene 纯 TS 场景类 + Shader

**Files:**
- Create: `src/three/shaders/particles.vert`、`src/three/shaders/particles.frag`、`src/three/ParticleScene.ts`

**Interfaces:**
- Consumes: `ParticleDensity`、`resolveParticleCount`（Task 8）
- Produces:
  ```ts
  export interface ParticleSceneOptions {
    count: number
    colorA: string   // '#22d3ee'
    colorB: string   // '#8b5cf6'
  }
  export class ParticleScene {
    constructor(canvas: HTMLCanvasElement)
    init(options: ParticleSceneOptions): void
    setDensity(density: ParticleDensity): void   // 由外层把 isMobile 折算进 density
    setParallaxTarget(x: number, y: number): void  // 归一化 [-0.5, 0.5]
    dispose(): void  // 幂等
  }
  ```
  消费方：Task 10（ParticleBackground.vue）

- [ ] **Step 1: 写 vertex shader（?raw 导入，不引插件——补充 8）**

`src/three/shaders/particles.vert`：

```glsl
uniform float uTime;
uniform float uPixelRatio;
uniform float uParallaxX;
uniform float uParallaxY;
uniform vec3 uColorA;
uniform vec3 uColorB;

attribute float aSize;
attribute float aAngle;
attribute float aRadius;
attribute float aSpeed;
attribute float aDrift;
attribute float aColorMix;

varying float vColorMix;

void main() {
  vec3 pos = position;
  float t = uTime * aSpeed + aDrift;
  pos.x += sin(t) * aRadius;
  pos.y += cos(t * 0.8) * aRadius * 0.6;
  pos.z += cos(t * 0.5) * aRadius;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = aSize * uPixelRatio * (240.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
  vColorMix = aColorMix;
}
```

- [ ] **Step 2: 写 fragment shader**

`src/three/shaders/particles.frag`：

```glsl
precision mediump float;

uniform vec3 uColorA;
uniform vec3 uColorB;
varying float vColorMix;

void main() {
  float d = distance(gl_PointCoord, vec2(0.5));
  if (d > 0.5) discard;
  float alpha = smoothstep(0.5, 0.05, d);
  vec3 color = mix(uColorA, uColorB, vColorMix);
  gl_FragColor = vec4(color, alpha * 0.8);
}
```

- [ ] **Step 3: 写 ParticleScene.ts**

```ts
import * as THREE from 'three'
import vertexShader from './shaders/particles.vert?raw'
import fragmentShader from './shaders/particles.frag?raw'
import { resolveParticleCount, type ParticleDensity } from '@/stores/particles'

export interface ParticleSceneOptions {
  count: number
  colorA: string
  colorB: string
}

export class ParticleScene {
  private renderer: THREE.WebGLRenderer | null = null
  private scene: THREE.Scene | null = null
  private camera: THREE.PerspectiveCamera | null = null
  private points: THREE.Points | null = null
  private material: THREE.ShaderMaterial | null = null
  private geometry: THREE.BufferGeometry | null = null
  private rafId = 0
  private clock = new THREE.Clock()
  private elapsed = 0
  private renderedStatic = false
  private parallaxTarget = { x: 0, y: 0 }
  private density: ParticleDensity = 'off'
  private isMobile = false
  private pageVisible = true
  private reducedMotion = false
  private disposed = false
  private onResizeBound = () => this.onResize()
  private onVisibilityBound = () => this.onVisibility()

  constructor(private canvas: HTMLCanvasElement) {}

  init(options: ParticleSceneOptions): void {
    if (this.disposed) return
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    )
    this.camera.position.z = 30

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.buildPoints(options.count, options.colorA, options.colorB)

    window.addEventListener('resize', this.onResizeBound)
    document.addEventListener('visibilitychange', this.onVisibilityBound)
    this.onResize()
    this.tick()
  }

  setDensity(density: ParticleDensity): void {
    this.density = density
    this.applyDensity()
  }

  setMobile(isMobile: boolean): void {
    this.isMobile = isMobile
    this.applyDensity()
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced
  }

  setParallaxTarget(x: number, y: number): void {
    this.parallaxTarget.x = x
    this.parallaxTarget.y = y
  }

  private applyDensity(): void {
    if (!this.points || !this.material) return
    const count = resolveParticleCount(this.density, this.isMobile)
    this.points.visible = count > 0
  }

  private buildPoints(count: number, colorA: string, colorB: string): void {
    if (!this.scene) return
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const angles = new Float32Array(count)
    const radii = new Float32Array(count)
    const speeds = new Float32Array(count)
    const drifts = new Float32Array(count)
    const colorMixes = new Float32Array(count)

    // 粒子散布在 60×36×30 的扁盒内，z 居中，相机在 z=30
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60
      positions[i * 3 + 1] = (Math.random() - 0.5) * 36
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30
      sizes[i] = Math.random() * 1.6 + 0.4
      angles[i] = Math.random() * Math.PI * 2
      radii[i] = Math.random() * 1.2 + 0.2
      speeds[i] = Math.random() * 0.4 + 0.1
      drifts[i] = Math.random() * Math.PI * 2
      colorMixes[i] = Math.random()
    }

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    this.geometry.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1))
    this.geometry.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1))
    this.geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
    this.geometry.setAttribute('aDrift', new THREE.BufferAttribute(drifts, 1))
    this.geometry.setAttribute('aColorMix', new THREE.BufferAttribute(colorMixes, 1))

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uParallaxX: { value: 0 },
        uParallaxY: { value: 0 },
        uColorA: { value: new THREE.Color(colorA) },
        uColorB: { value: new THREE.Color(colorB) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    this.points = new THREE.Points(this.geometry, this.material)
    this.points.frustumCulled = false
    this.scene.add(this.points)
  }

  private onResize(): void {
    if (!this.renderer || !this.camera) return
    const w = window.innerWidth
    const h = window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  private onVisibility(): void {
    this.pageVisible = document.visibilityState === 'visible'
  }

  private tick = (): void => {
    if (this.disposed) return
    this.rafId = requestAnimationFrame(this.tick)
    if (!this.pageVisible || !this.renderer || !this.scene || !this.camera) {
      return
    }
    // 注意：getDelta 每帧只能调一次，勿与 getElapsedTime 混用（后者内部也调 getDelta）
    const dt = Math.min(this.clock.getDelta(), 0.05)
    if (this.reducedMotion) {
      if (this.renderedStatic) return // 只渲染一帧静态画面（§5.3）
      this.renderedStatic = true
    } else {
      this.elapsed += dt
      if (this.material) {
        this.material.uniforms.uTime.value = this.elapsed
      }
      // 视差：指数趋近（帧率无关），作用在场景整体
      const k = 2.5
      this.scene.rotation.y += (this.parallaxTarget.x * 0.4 - this.scene.rotation.y) * k * dt
      this.scene.rotation.x += (-this.parallaxTarget.y * 0.2 - this.scene.rotation.x) * k * dt
    }
    if (this.points && !this.points.visible) {
      return
    }
    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    cancelAnimationFrame(this.rafId)
    window.removeEventListener('resize', this.onResizeBound)
    document.removeEventListener('visibilitychange', this.onVisibilityBound)
    this.scene?.traverse((obj) => {
      if (obj instanceof THREE.Points) {
        obj.geometry?.dispose()
        const mat = obj.material as THREE.ShaderMaterial | THREE.ShaderMaterial[]
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
        else mat?.dispose()
      }
    })
    this.renderer?.dispose()
    this.renderer = null
    this.scene = null
    this.camera = null
    this.points = null
    this.material = null
    this.geometry = null
  }
}
```

- [ ] **Step 4: 类型检查**

Run: `npm run build`
Expected: 通过（`?raw` 导入类型由 `vite/client` 覆盖）

- [ ] **Step 5: Commit**

```bash
git add src/three
git commit -m "feat: GPU 粒子场景类与 shader（视差/降级/dispose）"
```

### Task 10: ParticleBackground.vue 接入 App

**Files:**
- Create: `src/components/particles/ParticleBackground.vue`
- Modify: `src/App.vue`

**Interfaces:**
- Consumes: `ParticleScene`（Task 9）、`particlesState`（Task 8）
- Produces: 全局粒子层组件，App 级挂载一次

- [ ] **Step 1: 写 ParticleBackground.vue**

```vue
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { ParticleScene } from '@/three/ParticleScene'
import { particlesState } from '@/stores/particles'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let scene: ParticleScene | null = null
let mediaMobile: MediaQueryList | null = null
let mediaReduced: MediaQueryList | null = null

// 监听回调必须与移除时引用一致，故定义为组件作用域具名函数
const applyMobile = () => scene?.setMobile(mediaMobile?.matches ?? false)
const applyReduced = () => scene?.setReducedMotion(mediaReduced?.matches ?? false)

function onPointerMove(e: PointerEvent) {
  scene?.setParallaxTarget(
    e.clientX / window.innerWidth - 0.5,
    e.clientY / window.innerHeight - 0.5,
  )
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  try {
    scene = new ParticleScene(canvas)
    scene.init({ count: 1000, colorA: '#22d3ee', colorB: '#8b5cf6' })
  } catch (err) {
    // WebGL 不可用（§5.3）：隐藏 canvas，回退 main.css 里的 CSS 渐变背景
    console.warn('[particles] WebGL 初始化失败，回退静态背景', err)
    canvas.style.display = 'none'
    return
  }
  scene.setDensity(particlesState.density) // 补上初始密度（watch 无 immediate）
  mediaMobile = window.matchMedia('(max-width: 767px)')
  mediaReduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  mediaMobile.addEventListener('change', applyMobile)
  mediaReduced.addEventListener('change', applyReduced)
  applyMobile()
  applyReduced()
  window.addEventListener('pointermove', onPointerMove, { passive: true })
})

watch(
  () => particlesState.density,
  (d) => scene?.setDensity(d),
)

onUnmounted(() => {
  window.removeEventListener('pointermove', onPointerMove)
  mediaMobile?.removeEventListener('change', applyMobile)
  mediaReduced?.removeEventListener('change', applyReduced)
  scene?.dispose()
  scene = null
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="pointer-events-none fixed inset-0 z-0 h-full w-full"
    aria-hidden="true"
  ></canvas>
</template>
```

- [ ] **Step 2: App.vue 接入**

`<AppNav />` 前插入：

```vue
<script setup lang="ts">
import ParticleBackground from '@/components/particles/ParticleBackground.vue'
</script>
<template>
  <div class="relative min-h-screen">
    <ParticleBackground />
    <!-- 其余不变 -->
  </div>
</template>
```

- [ ] **Step 3: 验证**

Run: `npm run dev`
Expected: 首页出现青紫渐变粒子且随鼠标轻微视差；切到 `/about` 粒子变稀（300）；切到 `/blog/任意文章` 粒子消失；缩小窗口 < 768px 粒子消失；DevTools Performance 录制路由来回切换 10 次，内存无持续上升。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: 全局粒子背景接入 App（密度随路由/移动端降级）"
```

### Task 11: Hero 入场动画

**Files:**
- Modify: `src/views/HomeView.vue`

**Interfaces:**
- Consumes: `profile`（Task 5）

- [ ] **Step 1: 写 HomeView（真实结构 + gsap.context）**

```vue
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import { profile } from '@/data/profile'

const heroRef = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null

onMounted(() => {
  if (!heroRef.value) return
  ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } })
    tl.from('.hero-title', { y: 50, opacity: 0 })
      .from('.hero-subtitle', { y: 30, opacity: 0 }, '-=0.7')
      .from('.hero-cta', { y: 20, opacity: 0 }, '-=0.7')
  }, heroRef.value)
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<template>
  <section ref="heroRef" class="section-container flex min-h-screen flex-col justify-center">
    <p class="hero-subtitle font-mono text-sm text-primary">
      {{ profile.title }}
    </p>
    <h1 class="hero-title mt-4 text-5xl font-bold leading-tight md:text-7xl">
      {{ profile.name }}
    </h1>
    <p class="hero-subtitle mt-6 max-w-xl text-lg text-text-muted">
      {{ profile.introShort }}
    </p>
    <div class="hero-cta mt-10 flex gap-4">
      <RouterLink to="/projects" class="btn-primary">看看项目</RouterLink>
      <RouterLink
        to="/about"
        class="inline-flex items-center rounded-lg border border-white/10 px-6 py-3 text-sm transition-colors hover:border-white/30"
      >
        关于我
      </RouterLink>
    </div>
  </section>
</template>
```

- [ ] **Step 2: 验证**

Run: `npm run dev`
Expected: 进入首页标题/副标题/按钮错峰入场；来回切换路由，动画每次都正常重播且无残留 tween（GSAP 面板无堆积）。

- [ ] **Step 3: Commit**

```bash
git add src/views/HomeView.vue
git commit -m "feat: Hero 入场动画（gsap.context 作用域）"
```

### Task 12: useGsapReveal 滚动入场 composable

**Files:**
- Create: `src/composables/useGsapReveal.ts`
- Modify: `src/views/AboutView.vue`、`src/views/ProjectsView.vue`（占位 section 接入）

**Interfaces:**
- Produces:
  ```ts
  export function useGsapReveal(
    scope: Ref<HTMLElement | null>,
    options?: { y?: number; stagger?: number },
  ): void
  ```
  行为：观察 `scope` 内带 `[data-reveal]` 的元素，进入视口一次后 `gsap.to` 入场并 `unobserve`；组件卸载时 `ctx.revert()` 且 `observer.disconnect()`。消费方：阶段③各内容页。

- [ ] **Step 1: 实现**

```ts
import { onUnmounted, watch, type Ref } from 'vue'
import gsap from 'gsap'

export function useGsapReveal(
  scope: Ref<HTMLElement | null>,
  options: { y?: number; stagger?: number } = {},
) {
  const { y = 40, stagger = 0.1 } = options
  let ctx: gsap.Context | null = null
  let observer: IntersectionObserver | null = null

  function setup(el: HTMLElement) {
    ctx = gsap.context(() => {
      const items = el.querySelectorAll('[data-reveal]')
      gsap.set(items, { opacity: 0, y })
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            const target = entry.target as HTMLElement
            const index = Number(target.dataset.index ?? 0)
            gsap.to(target, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: 'power3.out',
              delay: index * stagger,
            })
            observer?.unobserve(target) // 进入一次即停
          }
        },
        { threshold: 0.1 },
      )
      items.forEach((el, i) => {
        ;(el as HTMLElement).dataset.index = String(i)
        observer?.observe(el)
      })
    }, el)
  }

  watch(scope, (el) => {
    if (el) setup(el)
  })

  onUnmounted(() => {
    observer?.disconnect()
    ctx?.revert()
  })
}
```

- [ ] **Step 2: AboutView 占位接入**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useGsapReveal } from '@/composables/useGsapReveal'

const scopeRef = ref<HTMLElement | null>(null)
useGsapReveal(scopeRef)
</script>

<template>
  <section ref="scopeRef" class="section-container min-h-screen">
    <h2 data-reveal class="text-3xl font-bold">关于</h2>
    <p data-reveal class="mt-4 text-text-muted">占位内容（阶段③填充）</p>
  </section>
</template>
```

ProjectsView 同构接入。

- [ ] **Step 3: 验证**

Run: `npm run dev`
Expected: 滚动到关于/项目页，带 `data-reveal` 元素逐个淡入；重复滚动不重复触发；路由切换后无报错。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: 滚动入场 composable（IO+gsap，一次触发）"
```

### Task 13: 阶段②验收

- [ ] **Step 1: 自检清单**

1. `npm run build` 通过（vue-tsc）✅/❌
2. 桌面 DevTools Performance：粒子页 60fps（无长任务）✅/❌
3. 路由来回切换 10 次：Memory 面板 JS heap 无持续上升（无泄漏）✅/❌
4. 移动端（DevTools 设备模拟或真机）：粒子不渲染 ✅/❌
5. 系统开启"减弱动态效果"后：粒子静止、入场动画直接呈现终态 ✅/❌
6. 切换到其他标签页再回来：粒子恢复渲染（visibilitychange）✅/❌

- [ ] **Step 2: 输出验收清单给用户，人工走查通过后 Commit 并进入阶段③**

```bash
git add -A && git commit -m "feat: 阶段②完成：粒子背景与动画体系"
```

---

# 阶段 ③ 真实内容

前置条件（§10）：头像、简介、技能标签（≤10）、项目截图与信息、2-3 篇博客文章、社交链接、favicon 全部就位。**素材未就位不开始本阶段。**

### Task 14: 真实个人信息 + AboutView

**Files:**
- Modify: `src/data/profile.ts`（填真实数据）、`src/views/AboutView.vue`（完成版）、`src/components/ui/SkillTag.vue`（新建）、`src/components/ui/SectionTitle.vue`（新建）
- Create: `public/images/avatar.webp`（用户提供，AI 不生成占位图）

**Interfaces:**
- Consumes: `profile` 字段结构（Task 5 定义，不变）
- Produces: `SkillTag`（props: `{ name: string; level?: '熟练' | '了解' }`）、`SectionTitle`（props: `{ title: string; subtitle?: string }`），阶段③其他页面复用

- [ ] **Step 1: 核对素材清单（§10 表格）并向用户确认逐项到位**

- [ ] **Step 2: 填真实 profile.ts（保持既有类型结构，仅换内容）**

- [ ] **Step 3: 写 SectionTitle 与 SkillTag**

`SectionTitle.vue`：

```vue
<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <div data-reveal class="mb-12">
    <h2 class="text-3xl font-bold md:text-4xl">{{ title }}</h2>
    <p v-if="subtitle" class="mt-3 text-text-muted">{{ subtitle }}</p>
  </div>
</template>
```

`SkillTag.vue`：

```vue
<script setup lang="ts">
defineProps<{ name: string; level?: '熟练' | '了解' }>()
</script>

<template>
  <span
    class="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-sm"
    :class="level === '熟练' ? 'border-primary/40 text-primary' : 'text-text-muted'"
  >
    {{ name }}
  </span>
</template>
```

- [ ] **Step 4: 完成 AboutView**

结构：`SectionTitle(title="关于我")` + 头像 + `introLong` + 技能区（`v-for profile.skills` 渲染 `SkillTag`，包 `data-reveal`）+ 社交链接列表。全部文案取自 `profile`。

- [ ] **Step 5: 验证 + Commit**

Run: `npm run build && npm run dev` 视觉走查后：

```bash
git add -A
git commit -m "content: 真实个人信息与关于页"
```

### Task 15: 真实项目 + ProjectCard + ProjectsView

**Files:**
- Modify: `src/data/projects.ts`（真实项目数据）
- Create: `src/components/ui/ProjectCard.vue`
- Modify: `src/views/ProjectsView.vue`
- Create: `public/projects/*.webp`（用户提供的截图）

**Interfaces:**
- Consumes: `Project` 接口（Task 5）
- Produces: `ProjectCard`（props: `{ project: Project }`）

- [ ] **Step 1: 填真实 projects.ts（§10 规格：标题 + 3-5 句描述 + 标签 + GitHub 链接；`image` 填文件名如 `demo.webp`，路径前缀由 ProjectCard 拼接）**

- [ ] **Step 2: 写 ProjectCard.vue**

```vue
<script setup lang="ts">
import type { Project } from '@/data/projects'

defineProps<{ project: Project }>()
</script>

<template>
  <article data-reveal class="card group overflow-hidden transition-colors hover:border-white/20">
    <div v-if="project.image" class="aspect-video overflow-hidden bg-surface">
      <img
        :src="`${import.meta.env.BASE_URL}projects/${project.image}`"
        :alt="project.title"
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
    <div class="p-6">
      <h3 class="text-lg font-semibold">{{ project.title }}</h3>
      <p class="mt-2 text-sm leading-relaxed text-text-muted">{{ project.description }}</p>
      <ul class="mt-4 flex flex-wrap gap-2">
        <li
          v-for="tag in project.tags"
          :key="tag"
          class="rounded-full border border-white/10 px-3 py-1 text-xs text-text-muted"
        >
          {{ tag }}
        </li>
      </ul>
      <div class="mt-5 flex gap-4 text-sm">
        <a v-if="project.github" :href="project.github" target="_blank" rel="noopener" class="text-primary hover:underline">
          GitHub
        </a>
        <a v-if="project.demo" :href="project.demo" target="_blank" rel="noopener" class="text-text-muted hover:underline">
          在线演示
        </a>
      </div>
    </div>
  </article>
</template>
```

- [ ] **Step 3: 完成 ProjectsView**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { projects } from '@/data/projects'
import ProjectCard from '@/components/ui/ProjectCard.vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import { useGsapReveal } from '@/composables/useGsapReveal'

const scopeRef = ref<HTMLElement | null>(null)
useGsapReveal(scopeRef)
</script>

<template>
  <section ref="scopeRef" class="section-container min-h-screen">
    <SectionTitle title="项目" subtitle="我做过的部分项目" />
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <ProjectCard v-for="p in projects" :key="p.slug" :project="p" />
    </div>
  </section>
</template>
```

- [ ] **Step 4: 验证 + Commit**

Run: `npm run build && npm run dev` 视觉走查后 commit：`content: 真实项目数据与项目卡片网格`

### Task 16: 博客渲染（markdown-it + shiki）+ 列表/详情页

**Files:**
- Create: `src/lib/markdown.ts`、`src/components/ui/BlogCard.vue`
- Modify: `src/views/BlogListView.vue`、`src/views/BlogPostView.vue`
- Create: `src/blog/*.md`（2-3 篇真实文章，frontmatter 完整）

**Interfaces:**
- Consumes: `BlogMeta`/`listPosts`/`blogModules`（Task 6）
- Produces: `export function renderMarkdown(src: string): string`（同步；shiki 在模块加载时初始化）

- [ ] **Step 1: 核验 shiki 与 markdown-it 集成方式**

Run: `npx ctx7@latest library shiki "markdown-it integration @shikijs/markdown-it setup"`
再查 docs，按当前推荐方式安装（预期 `npm i shiki @shikijs/markdown-it`；若推荐形态变化，以文档为准）。

- [ ] **Step 2: 写 src/lib/markdown.ts**

```ts
import MarkdownIt from 'markdown-it'
import { codeToHtml } from 'shiki'

const md = new MarkdownIt({
  html: false, // 安全：不渲染原始 HTML
  linkify: true,
})

md.options.highlight = (code, lang) => {
  return codeToHtml(code, { lang: lang || 'text', theme: 'github-dark' })
}

export function renderMarkdown(src: string): string {
  return md.render(src)
}
```

（若 ctx7 核验发现当前推荐 `@shikijs/markdown-it` 插件形态，改用该插件并保持 `renderMarkdown` 签名不变。highlight 回调在 Node/Vite 构建环境下同步执行，`codeToHtml` 为同步 API——以核验结果为准。）

- [ ] **Step 3: 写 BlogCard.vue**

```vue
<script setup lang="ts">
import type { BlogMeta } from '@/lib/blog'

defineProps<{ post: BlogMeta }>()
</script>

<template>
  <RouterLink
    :to="`/blog/${post.slug}`"
    data-reveal
    class="card block p-6 transition-colors hover:border-white/20"
  >
    <time class="font-mono text-xs text-text-muted">{{ post.date }}</time>
    <h3 class="mt-2 text-lg font-semibold">{{ post.title }}</h3>
    <p class="mt-2 line-clamp-2 text-sm text-text-muted">{{ post.desc }}</p>
    <ul class="mt-4 flex gap-2">
      <li v-for="tag in post.tags" :key="tag" class="text-xs text-primary">#{{ tag }}</li>
    </ul>
  </RouterLink>
</template>
```

- [ ] **Step 4: 完成 BlogListView.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { listPosts, blogModules } from '@/lib/blog'
import BlogCard from '@/components/ui/BlogCard.vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import { useGsapReveal } from '@/composables/useGsapReveal'

const posts = listPosts(blogModules)
const scopeRef = ref<HTMLElement | null>(null)
useGsapReveal(scopeRef)
</script>

<template>
  <section ref="scopeRef" class="section-container min-h-screen">
    <SectionTitle title="博客" subtitle="记录学习与思考" />
    <div class="grid gap-6 md:grid-cols-2">
      <BlogCard v-for="post in posts" :key="post.slug" :post="post" />
    </div>
  </section>
</template>
```

- [ ] **Step 5: 完成 BlogPostView.vue**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { listPosts, blogModules } from '@/lib/blog'
import { renderMarkdown } from '@/lib/markdown'

const route = useRoute()
const post = computed(() =>
  listPosts(blogModules).find((p) => p.slug === route.params.slug),
)
const html = computed(() => (post.value ? renderMarkdown(post.value.content) : ''))
</script>

<template>
  <article class="section-container min-h-screen max-w-3xl">
    <div v-if="post">
      <h1 class="text-3xl font-bold md:text-4xl">{{ post.title }}</h1>
      <div class="mt-3 flex items-center gap-4 font-mono text-sm text-text-muted">
        <time>{{ post.date }}</time>
        <span v-for="tag in post.tags" :key="tag">#{{ tag }}</span>
      </div>
      <div class="blog-content mt-10" v-html="html"></div>
    </div>
    <p v-else class="text-text-muted">文章不存在</p>
  </article>
</template>
```

- [ ] **Step 6: styles/main.css 增加 .blog-content 排版样式（components 层）**

```css
.blog-content h1, .blog-content h2, .blog-content h3 { @apply mt-8 mb-4 font-semibold text-text; }
.blog-content p { @apply my-4 leading-relaxed text-text-muted; }
.blog-content pre { @apply my-4 overflow-x-auto rounded-lg border border-white/10 p-4 text-sm; }
.blog-content code { @apply font-mono; }
.blog-content a { @apply text-primary hover:underline; }
```

- [ ] **Step 7: 写 2-3 篇真实文章（frontmatter: title/date/tags/desc）**

- [ ] **Step 8: 验证 + Commit**

Run: `npm run build`（确认首屏 chunk 不含 shiki——构建产物中 shiki 相关代码应在 BlogPostView 的懒加载 chunk 里）+ `npm run dev` 走查列表页与详情页。

```bash
git add -A
git commit -m "content: 博客渲染管线与文章"
```

### Task 17: 阶段③验收

- [ ] **Step 1: 自检清单**

1. §10 素材全部就位且未中途新增素材种类 ✅/❌
2. 组件内零硬编码文案（grep 检查：views/components 里不应出现用户个人信息的字面量）✅/❌
3. `npm run build` + `npm test` + `npm run lint` 全绿 ✅/❌
4. 视觉走查：首页/关于/项目/博客列表/文章详情五页完整、移动端布局正常 ✅/❌

- [ ] **Step 2: 用户确认后 Commit**

```bash
git add -A && git commit -m "content: 阶段③完成：全站真实内容"
```

---

# 阶段 ④ 部署上线

验收标准（§9）：线上可访问、刷新不 404、Lighthouse ≥ 90 + 人工检查点。

### Task 18: 404 回退联调（补充 13）

**Files:**
- Modify: `index.html`（加恢复脚本）

- [ ] **Step 1: index.html 的 `<head>` 最前加入恢复脚本（同步、无 defer/async）**

```html
<script>
  (function () {
    var redirect = sessionStorage.redirect;
    delete sessionStorage.redirect;
    if (redirect && redirect !== location.href) {
      history.replaceState(null, '', redirect);
    }
  })();
</script>
```

位置：`<meta charset>` 之前，`<head>` 内第一个元素。

- [ ] **Step 2: 本地验证 postbuild 产物**

Run: `npm run build && grep -c "sessionStorage.redirect" dist/404.html`
Expected: 输出 ≥ 2（重定向脚本 + 恢复脚本都在）。

- [ ] **Step 3: Commit**

```bash
git add index.html && git commit -m "deploy: 404 回退恢复脚本"
```

### Task 19: GitHub Actions 工作流

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: 核验 actions 当前主版本**

Run: `npx ctx7@latest library "GitHub Actions" "deploy to github pages checkout setup-node upload-pages-artifact deploy-pages"`
（若 ctx7 无 Actions 条目，用 `gh api` 或官方文档页核验 `actions/*` 各 action 的当前主版本号。）

- [ ] **Step 2: 写 .github/workflows/deploy.yml**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Commit**

```bash
git add .github && git commit -m "deploy: GitHub Pages 自动部署工作流"
```

### Task 20: 推送 GitHub 与 Pages 配置

- [ ] **Step 1: 与用户确认新仓库名（默认 `portfolio`）及创建方式（用户手动在 GitHub 网页创建，或 `gh repo create`）**

- [ ] **Step 2: 推送 dev 分支**

```bash
git remote add origin https://github.com/xrk-hhh/<repo>.git
git push -u origin dev
```

- [ ] **Step 3: 合并到 main 触发首次部署**

```bash
git checkout main
git merge dev --no-ff
git push origin main
```

（`git checkout main` 为本地 main；若 main 为远程默认分支且本地没有，用 `git fetch origin && git checkout -b main origin/main`。工作流只监听 main push。）

- [ ] **Step 4: Pages 配置**

GitHub 仓库 Settings → Pages → Build and deployment → Source 选 **GitHub Actions**。

- [ ] **Step 5: 验证 Actions**

Actions 页确认 `Deploy to GitHub Pages` 成功，访问 `https://xrk-hhh.github.io/<repo>/` 可打开。

- [ ] **Step 6: 切回 dev 继续开发**

```bash
git checkout dev
```

### Task 21: 线上验证与最终验收

- [ ] **Step 1: 嵌套路由刷新验证**

访问 `https://xrk-hhh.github.io/<repo>/blog/任意文章` 直接刷新：页面正常加载且 URL 不变 ✅/❌（§8.3 验收项）。

- [ ] **Step 2: Lighthouse 验证**

Run: `npx lighthouse https://xrk-hhh.github.io/<repo>/ --preset=desktop --output=json --output-path=/tmp/lh.json`
（或 Chrome DevTools Lighthouse 面板），检查 Performance ≥ 90、首屏 JS gzip < 300KB。

- [ ] **Step 3: 最终验收清单（对照 §9④ + §11 风险表）**

1. 线上可访问、四页 + 文章详情正常 ✅/❌
2. 子路由刷新不 404 ✅/❌
3. 图片/资源路径正确（无 404 请求）✅/❌
4. Lighthouse Performance ≥ 90 ✅/❌
5. 移动端：粒子不渲染、布局正常 ✅/❌

- [ ] **Step 4: 打 tag 收尾**

```bash
git tag v1.0.0 && git push origin v1.0.0
```

---

## 附：任务依赖图

```
T1 → T2 → T3 → T4 → T5 → T6 → T7          （阶段①串行）
                          ↓
T8 → T9 → T10 → T11 → T12 → T13            （阶段②，T11/T12 可并行）
                                    ↓
T14 → T15 → T16 → T17                       （阶段③，T14/T15/T16 可并行）
                              ↓
T18 → T19 → T20 → T21                       （阶段④）
```

阶段间为硬性人工检查点（§0 执行协议），上一阶段验收通过才能开始下一阶段。
