# 个人网站项目计划（Plan.md）

> 最后更新：2026-08-14
> 状态：设计已确认，待实施

## 0. 执行协议（与 Claude Code 协作）

- **阶段启动前**：Claude Code 先根据本 Plan 列出该阶段待创建/修改的文件清单和关键 API 用法（必要时用 ctx7 核验最新文档），确认后再动工。
- **阶段结束后**：输出该阶段验收清单，对照 §9 的验收标准逐项确认。
- **人工检查点**：每个阶段结束，用户运行 `npm run dev` 和 `npm run build` 确认无报错，并视觉走查核心页面；通过后才进入下一阶段。
- **避免方向漂移**：一次只执行一个阶段，不跨阶段提前实现后续功能。

## 1. 项目概述

**目标**：搭建个人网站，包含 首页（Hero + 粒子背景 + 入场动画）、关于（简介 + 技能标签）、项目（卡片网格 + 截图 + 链接）、博客（Markdown 文章）四个页面，通过 GitHub Actions 自动部署到 GitHub Pages。

**技术栈**：Vue 3 + TypeScript + Vite · Tailwind CSS v4 · Three.js（粒子背景）· GSAP（滚动/入场动画）· vue-router 5 · markdown-it + shiki + js-yaml（博客）· GitHub Actions（部署）

**已确认的关键决策**：
| 决策点 | 选择 |
|---|---|
| 视觉风格 | 深色科技感：背景 `#0a0a12`，粒子青/紫渐变发光，文字白主灰辅，cyan→violet 渐变点缀 |
| 站点语言 | 纯中文 |
| 部署方式 | `Website/` 目录内独立 git 仓库，推送新 GitHub 仓库 |
| 博客方案 | SPA 内置 Markdown（`import.meta.glob` + markdown-it + shiki），不用 VitePress/Nuxt |
| 粒子架构 | 方案 A：全局粒子层（App 级 canvas 只挂载一次，路由切换不重建） |
| 版本管理 | `dev` 分支日常开发，阶段验收通过后合并到 `main` 触发部署 |

**核心原则**：
1. **性能优先，克制动画**——不堆砌特效。明确的不引入清单：Lenis、GLB 3D 模型、音效、Pinia、UI 组件库、双主题、万级粒子。
2. **数据与组件分离**——个人数据在 `src/data/`，博客在 Markdown，改内容不改组件。
3. **生命周期纪律**——Three.js/GSAP 资源必须成对 init/destroy，SPA 路由切换不泄漏。

## 2. 参考项目调研总结

共调研 5 个仓库（4 个既有候选 + 调研中发现的新仓库）。**许可证注意**：仅 devportfolio-3d-vue 是标准 MIT；portfolio-2025 要求署名；codrops 与 ionrusu 仓库无 LICENSE 文件——一律只借鉴模式，不直接搬代码。

### 2.1 MokammelTanvir/devportfolio-3d-vue（MIT）

技术栈与本项目最接近的模板：Vue3（Composition API）+ Three.js 0.159 + GSAP 3.12 + Tailwind 3 + Vite。

- **页面结构**：单页平铺 7 个组件（NavBar/Hero/About/Skills/Projects/Contact/Footer），锚点导航，无路由。
- **动画设计**：Hero 标题 GSAP timeline 错峰入场（`.from(..., {y:50, opacity:0, ease:"power3.out"})` + `"-=0.7"` 重叠）；滚动入场用 IntersectionObserver + gsap.set/to（**不用 ScrollTrigger**）；3D 倾斜卡片（GSAP rotateX/rotateY + CSS 径向渐变 glare 高光 + `translateZ` 景深）；3000 粒子 Points 整体慢旋。
- **代码组织**：每个 section 一个自包含 .vue；Three.js 初始化代码在三个组件里几乎重复三遍；数据全部硬编码在组件内。
- **可借鉴**：IO + gsap 滚动入场模式、CSS-only 倾斜卡片、纯几何体拼模型（零 GLB 资产）、`base: command === 'serve' ? '/' : '/repo/'` 的 Pages 路径写法。
- **反面教训**：无移动端降级、无 reduced-motion、DPR 无上限、Hero 的 dispose 只清理了子级一层（嵌套几何泄漏）、自定义 Tailwind 色未在 theme.extend 定义导致类名静默失效、IO 从不 unobserve。

### 2.2 davidhckh/portfolio-2025（843 ⭐，需署名）

Vue 3.5 + TS + Three.js 0.181 + GSAP + Lenis + Howler，自制路由/i18n，SCSS。调研中工程化水平最高的参考。

- **页面结构**：Home 单页滚动 + 项目详情"覆盖层"（非路由切换，Home 保活、`visibility: hidden`）。
- **动画设计（核心模式）**：
  - **场景权重系统**：ScrollTrigger scrub 只驱动各场景的 0-1 权重值（`sceneWeightsInOut`），相机位姿 = 多个 waypoint 数据（横竖屏两套）按权重加权平均——完全数据驱动、天然可逆、改镜头只改数据。
  - **统一时钟**：Lenis 不自己跑 rAF，`lenis.raf()` 放进 `gsap.ticker`，与 ScrollTrigger、3D 渲染共用一个时钟；转场时 `lenis.stop()/start()`。
  - **GPU 粒子**：粒子属性（offset/angle/radius/speed/drift/noise/size）全部进 BufferAttribute，CPU 每帧只更新 uniform，运动在 vertex shader 计算；`depthWrite:false, frustumCulled:false`。
- **性能**：pixelRatio ≤ 2、ResizeObserver 代替 window resize、页面失活即 `renderer.setIsActive(false)` 跳过渲染、`renderer.compile()` 预编译 shader 防首帧卡、离屏 RT 按需渲染、特性开关一键关动画。
- **代码组织**：`src/three/` 纯 TS 模块与 Vue 完全解耦（core 单例 + objects 每物一目录 + shaders 按物分），`src/animations/` 独立动画层，内容即 TS 数据文件 + `import.meta.glob` 按 slug 注册。
- **可借鉴**：场景权重系统（Hero 滚动衔接的预留扩展点）、GPU 粒子、渲染门控、`gsap.matchMedia` 分端动画、init/destroy 成对纪律。
- **注意**：其 404 问题（history 路由 + Pages 子路径）需用 `404.html` 回退解决——本计划已包含。

### 2.3 JosephASG/codrops-cinematic-scroll-animations（66 ⭐，无 LICENSE 文件）

Codrops 电影级滚动教程的复刻（React，但模式与框架无关）。

- **核心模式——数据代理对象桥接**：GSAP 从不直接动 Three.js 对象，只 tween 普通 JS 对象 `cam = {x,y,z,tx,ty,tz}`，rAF 每帧读取并应用到相机（`camera.position.set(cam.x,...)`）。滚动与渲染彻底解耦，避免响应式包裹性能坑。**这是全调研中最重要的模式**。
- **数据驱动镜头路径**：每段镜头运动声明为 `{camera, target, scrollProgress:{start,end}}` 数据数组，循环生成 timeline——改镜头只改数据。
- **固定画布 + 超高 spacer**：canvas `fixed inset-0`，滚动由 `height: 500svh` 占位 div 提供，ScrollTrigger 以 spacer 为 trigger。
- **性能细节**：DPR 钳制、纹理尺寸按 `MAX_TEXTURE_SIZE` 钳制、移动端地址栏跳动防护（宽度未变即跳过 resize）、按断点分级相机参数、资产 onload 后才创建 ScrollTrigger。
- **反面教训**：rAF 无 cancel、renderer/geometry 无 dispose（StrictMode 双挂载下泄漏）——我们要补全。

### 2.4 iluna007/Portfolio_05_Threejs_journey_04_LandPage_Portfolio

Three.js Journey 课程滚动练习（纯 JS 单文件，但模式可平移）。

- **滚动→相机 1:1 硬映射**：`camera.position.y = (-scrollY / viewportHeight) * objectsDistance`，物体按间距等距排布，比 lerp 跟随更"贴手"。
- **GSAP 事件驱动 + rAF 连续运动分离**：滚动只在"跨章节边界"瞬间发一次性相对 tween（`rotation: {x:"+=6",...}`），rAF 管连续运动——可打断、可叠加。
- **鼠标视差三行代码**：归一化到 [-0.5,0.5]，`pos += (target - pos) * k * deltaTime` 指数趋近，帧率无关。滚动偏移写 camera、视差写父 Group，互不干扰。
- **静态粒子几何**：粒子 Float32Array 一次性铺满滚动行程，tick 零更新，靠相机移动产生视差感。
- **反面教训**：单文件 221 行无架构、node_modules/dist 被提交、无任何 dispose（Vue SPA 必须补）。

### 2.5 ionrusu114/portofolio_ionrusu114（调研新发现，技术栈最契合）

Vue 3.5 + TS 5.9 + Vite 8 + **Tailwind CSS 4** + GSAP 3.14 + Three.js 0.183 + vue-router 4 + Vitest。与本项目技术栈几乎 100% 一致，架构最清晰。

- **页面结构**：横向滚动单页（Hero/About/Projects/GetOffer/Contact 五个 panel）+ intro 开场。层级：views → panels → sections → ui 原子组件（BaseTag/BasePanel/BaseGlowText）。
- **粒子背景**：全局独立组件 `TheBackgroundCanvas`（`pointer-events-none fixed inset-0 -z-10`），与 Hero 解耦；2000 粒子 ShaderMaterial bokeh 光晕（vertex 正弦漂移 + `gl_PointSize` 透视衰减，fragment 径向渐变 + discard 圆形裁剪，AdditiveBlending）；滚动进度经 `provide/inject`（InjectionKey）注入，驱动粒子旋转与相机视差；移动端粒子降到 500。
- **清理模板（最值得抄）**：`dispose()` 依次 cancelAnimationFrame → 移除 resize 监听 → geometry/material/renderer dispose → 引用置 null，挂 `onUnmounted`；GSAP 统一 `gsap.context(fn, scope)` + `ctx.revert()`。
- **Tailwind 4 用法**：CSS-first `@theme` 设计令牌（`--color-accent` 等）+ `@layer components` 复用类（`.card`/`.glow-text`），比到处堆原子类好维护。
- **数据组织**：`data/skills.ts`（Skill[] 含 level/category）+ `types/index.ts` 集中类型——与我们的"技能标签 + 项目卡片"需求几乎同构。
- **注意**：无 LICENSE；Docker 部署无 base 设置（我们走 Pages 需另行处理）。

### 2.6 调研结论：模式提炼

| 需求 | 采纳方案 | 来源 |
|---|---|---|
| 滚动↔3D 解耦 | 数据代理对象：GSAP 只 tween 普通对象，rAF 读取应用 | codrops |
| 粒子实现 | GPU 粒子：属性进 BufferAttribute，vertex shader 运动，CPU 只更新 uniform | portfolio-2025 |
| 滚动入场 | IntersectionObserver + gsap.set/to（不用 ScrollTrigger，除非有叙事价值） | devportfolio |
| 生命周期 | 成对 init/destroy + `gsap.context` 的 `ctx.revert()` + traverse 递归 dispose | ionrusu + portfolio-2025 |
| 设计令牌 | Tailwind 4 `@theme` 令牌 + `@layer components` 复用类 | ionrusu |
| 鼠标视差 | 归一化 + 指数趋近（`pos += (target-pos)*k*dt`） | journey |
| 性能纪律 | DPR ≤ 2、页面失活暂停渲染、GPU 粒子、静态几何优先 | 全体 |

## 3. 技术选型

| 层 | 选型 | 版本策略 |
|---|---|---|
| 框架 | Vue 3（`<script setup>`）+ TypeScript + Vite | 初始化时最新稳定版 |
| 路由 | vue-router 4（history 模式，路由懒加载） | |
| 样式 | Tailwind CSS v4（`@tailwindcss/vite` 插件，CSS-first 配置，无 config 文件） | |
| 3D | Three.js 原生（不引 TresJS 等封装层） | |
| 动画 | GSAP 3 + ScrollTrigger（按需注册） | |
| 博客 | markdown-it + shiki（代码高亮）+ gray-matter（frontmatter 解析） | |
| 字体 | 中文系统字体栈；英文/数字点缀用 JetBrains Mono（不引 webfont，避免中文 FOUT 与体积） | |
| 工程工具 | ESLint + Prettier（与 .vscode 配置对齐） | |

**明确不引入**：Lenis、GLB 模型、音效（Howler）、Pinia（全局仅一个粒子状态，用 reactive 单例即可）、UI 组件库、TresJS、@unhead（SEO meta 手写进 index.html）。

## 4. 架构设计

### 4.1 全局布局（方案 A）

```
App.vue（全局布局，仅挂载一次）
├─ ParticleBackground.vue   ← fixed 全屏 canvas 层 (z-0)，App 级挂载，会话内只初始化一次
├─ AppNav.vue               ← 顶部导航（滚动后毛玻璃）
├─ RouterView (z-10)        ← 内容层，包 <Transition> 做页面切换淡入
└─ AppFooter.vue
```

路由切换不重建 canvas → 无闪烁、无重复资源开销。粒子密度按当前路由响应式调整：首页密、内容页稀。实现：`stores/particles.ts`（reactive 单例：density/color/交互开关），`router.afterEach` 按 `route.meta.particles` 更新，ParticleBackground watch 它。

### 4.2 目录结构

```
Website/
├─ Plan.md
├─ package.json / package-lock.json
├─ vite.config.ts            # @ 别名、@tailwindcss/vite、base: './'
├─ tsconfig.json
├─ index.html                # SEO meta、字体栈、loading 背景色
├─ .gitignore
├─ .github/workflows/deploy.yml
├─ scripts/postbuild.mjs     # 构建后：生成 404.html + 注入重定向脚本
├─ public/
│  ├─ favicon.svg
│  ├─ images/avatar.webp     # 头像
│  └─ projects/*.webp        # 项目截图（webp，本地存放不外链）
└─ src/
   ├─ main.ts
   ├─ App.vue
   ├─ router/index.ts        # 5 条路由，懒加载，meta.particles 密度档位
   ├─ types/router.d.ts      # vue-router RouteMeta 扩展（meta.title / meta.particles）
   ├─ styles/main.css        # Tailwind 4 @theme 令牌 + @layer components 复用类
   ├─ stores/particles.ts    # reactive 单例（密度/颜色），route 驱动；纯 Vue reactive，非 Pinia，无额外依赖
   ├─ data/
   │  ├─ profile.ts          # 姓名/简介/技能/社交链接
   │  └─ projects.ts         # 项目卡片（标题/描述/tags/截图/链接）
   ├─ blog/*.md              # 文章（frontmatter: title/date/tags/desc）
   ├─ lib/
   │  ├─ markdown.ts         # markdown-it + shiki 配置（BlogPostView 内动态 import，不进首屏包）
   │  └─ blog.ts             # import.meta.glob 收集 → gray-matter 解析 → 排序 → 列表数据
   ├─ three/
   │  ├─ ParticleScene.ts    # 纯 TS 场景类（与 Vue 解耦）：init(canvas, options)/setDensity()/dispose()
   │  └─ shaders/particles.{vert,frag}.glsl
   ├─ components/
   │  ├─ particles/ParticleBackground.vue   # 薄封装：实例化场景类 + watch 密度 + onUnmounted 清理
   │  ├─ layout/AppNav.vue · AppFooter.vue
   │  └─ ui/SectionTitle.vue · SkillTag.vue · ProjectCard.vue · BlogCard.vue
   ├─ composables/useGsapReveal.ts   # IO + gsap.set/to 滚动入场，进入一次即 unobserve
   └─ views/HomeView.vue · AboutView.vue · ProjectsView.vue · BlogListView.vue · BlogPostView.vue
```

**package.json scripts 约定**（阶段 ① 写入；`postbuild` 在 `npm run build` 结束后由 npm 自动执行，无需手动调用）：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview",
    "postbuild": "node scripts/postbuild.mjs"
  }
}
```

### 4.3 数据流（改内容不改组件）

```
src/data/profile.ts / projects.ts   → 类型化数据（satisfies 编译期校验），组件只读渲染
src/blog/*.md                        → glob 收集（`as: 'raw'`，否则 Vite 把 .md 当 JS 模块解析报错）+ gray-matter → lib/blog.ts 生成文章元数据
                                         BlogListView 自动生成卡片 → BlogPostView 按 slug 渲染
粒子密度                                → route.meta → stores/particles → ParticleBackground
```

组件内零硬编码文案。加一篇文章 = 丢一个 md；改简介 = 改 profile.ts 一行。

### 4.4 SEO 与页面标题

- `index.html`：写入全站默认 meta（description、og:title、og:description、theme-color），保持全站统一。
- 页面标题：每个路由在 `meta.title` 中定义，通过 `router.afterEach` 动态更新 `document.title`（格式：`{页面标题} | {网站名}`）。
- 不引入 @unhead 等 SEO 库，保持轻量。
- 博客文章详情页可额外在 `meta.desc` 中定义摘要，动态更新 `meta[name="description"]`（可选，后续迭代）。

## 5. 动画设计

### 5.1 粒子背景（Hero 核心）

- **实现**：GPU 粒子（模式同 portfolio-2025）：每个粒子的 offset/angle/radius/speed/drift/size 进 BufferAttribute，vertex shader 做正弦漂移 + 透视点大小衰减，fragment 做径向渐变 + 圆形裁剪；`AdditiveBlending` + `depthWrite:false`；CPU 每帧只更新 `uTime` 与视差 uniform。shader 文件用 Vite 原生 `?raw` 后缀导入（`import vert from './shaders/particles.vert?raw'`），**不引入 vite-plugin-glsl**。
- **配色**：青→紫渐变（shader 内按粒子属性混色）。
- **交互**：鼠标视差——归一化 + `pos += (target-pos) * k * dt` 指数趋近（journey 模式）。
- **密度分档**（stores/particles，route 驱动）：
  | 档位 | 粒子数 | 适用 |
  |---|---|---|
  | 高 | 1000 | 首页 Hero |
  | 低 | 300 | 关于/项目/博客 |
  | 关 | 0（不渲染） | 文章详情页（阅读体验优先）+ 移动端 |

### 5.2 入场与滚动

- **Hero 入场**：标题/副标题/CTA 的 GSAP 时间线（y + opacity 错峰，`power3.out`），`onMounted` 触发一次。
- **页面切换**：`<Transition>` 内容层淡入（opacity + 轻微 y）。
- **滚动入场**：`useGsapReveal`——IO（threshold 0.1）+ `gsap.set` 初始态 + `gsap.to` 入场，stagger 用 DOM data 属性，进入一次即 `unobserve`。
- **克制原则**：ScrollTrigger scrub 只在"有叙事价值"处使用（如关于页统计数字滚动）；不为动画而动画。
- **预留扩展**：若将来做"滚动驱动粒子形态变化"，用 portfolio-2025 场景权重模式（scroll 只写 0-1 权重，waypoint 数据加权平均）——架构预留，首版不实现。

### 5.3 移动端与可访问性降级

- 移动端判定以**视口宽度 < 768** 为准：粒子默认关闭（阅读体验优先）；如后续实测低端机无压力，可放宽到 ≤ 200。
- `prefers-reduced-motion`：跳过粒子 RAF（渲染一帧静态图）、入场动画直接显示终态。
- WebGL 不可用（无 `webgl2/webgl` 上下文）：粒子层回退为纯 CSS 径向渐变背景。

## 6. 资源清理规范（硬性要求）

- **ParticleScene.dispose()**（幂等）：`cancelAnimationFrame` → 移除 resize/visibilitychange 监听 → `scene.traverse()` 递归 dispose geometry/material → `renderer.dispose()` → 引用置 null。
- **GSAP**：所有动画包在 `gsap.context(fn, scope)` 内，组件 `onUnmounted` 里 `ctx.revert()` 一行清空（tween + ScrollTrigger 全回滚）。
- **ParticleBackground.vue** `onUnmounted`：调用 `scene.dispose()` + `ctx.revert()`。
- 页面级 IO 在回调里 `unobserve`；不残留任何全局监听。

## 7. 性能预算（验收硬指标）

| 指标 | 目标 |
|---|---|
| 首屏 JS（gzip） | < 300KB（Three.js ~160KB 是大头；markdown-it/shiki 仅在博客详情页懒加载） |
| 桌面粒子 | ≤ 1000，GPU 渲染，CPU 每帧仅更新 uniform |
| 移动端粒子 | 视口 < 768px 默认关闭不渲染；后续实测无压力可放宽至 ≤ 200 |
| Lighthouse Performance | ≥ 90 |
| DPR | `Math.min(devicePixelRatio, 2)` |

**运行时纪律**：`document.visibilitychange` 时暂停渲染循环；所有动画只动 transform/opacity（合成层，不触发 layout）；路由懒加载；项目截图 webp + `loading="lazy"` + 固定宽高占位防 CLS；粒子几何静态、避免逐帧 CPU 更新顶点。

**博客性能扩展点（当前不实现）**：当前文章数量少（< 10 篇），`import.meta.glob` + 运行时 markdown-it/shiki 渲染足够。若未来文章超过 15 篇，应考虑：shiki 高亮改为构建时预编译（如 `@shikijs/markdown-it` 的构建期方案），或按需只加载当前文章的渲染依赖。实现时在 `lib/blog.ts` 中预留 TODO 注释标明此扩展点。

## 8. 部署方案（GitHub Pages）

1. `Website/` 内 `git init` 独立仓库，推送到新 GitHub 仓库（如 `xrk-hhh/portfolio`）。
   - 默认创建 `main` 分支，另建 `dev` 分支用于日常开发。
   - 开发流程：`dev` 上推进 → 阶段验收通过 → merge 到 `main` → Actions 自动部署。
   - 禁止直接在 `main` 上开发。
2. **绝对 base**：`vite.config.ts` 设 `base: command === 'serve' ? '/' : '/starlight/'`（T18 实施时修正：`createWebHistory` 需要绝对 base，相对路径方案在子路径部署下路由全部空白；仓库名已定为 `starlight`，参考 choslion/portfolio 的 `base: '/portfolio/'` 做法）。
3. **SPA 404 回退（嵌套路由安全）**：单纯复制 `index.html` 为 `404.html` 在二级以上路由（如 `/repo/blog/文章`）刷新时仍会 404——`base: './'` 的相对资源路径会解析到错误的目录层级。采用 sessionStorage 重定向方案，**禁止用 `new URL('.', location.href)` 作重定向目标**（只爬一级，对嵌套路由无效）。

   `scripts/postbuild.mjs`（完整实现）：
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
   验证：`/repo/about`、`/repo/blog/post-1`、`/repo/blog/` 均重定向到 `/repo/`；若将来改为 user site，`root` 需改为 `/`（Plan 变更时同步修改脚本）。

   `index.html` 恢复脚本——**必须放在 `<head>` 最前面、同步执行（不加 defer/async）**，确保 Vue 应用启动前 URL 已恢复，vue-router 才能匹配到正确路由：
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

   - 该方案在阶段 ④ 实现并测试；验收——部署后对 `/repo/blog/任意文章` 直接刷新，页面正常加载且 URL 保持不变。
4. **workflow**（`.github/workflows/deploy.yml`）：
   - 触发：push 到 main
   - 步骤：`actions/checkout@v4` → `actions/setup-node@v4`（Node LTS + npm cache）→ `npm ci` → `npm run build`（含 `vue-tsc --noEmit` 类型检查，失败不发布）→ `actions/upload-pages-artifact` → `actions/deploy-pages`
   - 仓库 Settings → Pages → Source 选 GitHub Actions
5. 首次部署后验证：站点可访问、子路由刷新不 404、图片/字体路径正确。

## 9. 实施步骤

| 阶段 | 内容 | 验收标准 |
|---|---|---|
| ① 初始化 + 骨架 | Vite 脚手架、Tailwind 4 + 设计令牌、vue-router 5 页占位、导航/页脚、data/ 空结构、ESLint/Prettier、types/router.d.ts（RouteMeta 扩展，vue-tsc 必过） | `npm run dev` 四页可切换；`vue-tsc` 通过<br>+ 人工确认：`npm run dev` 和 `npm run build` 无报错，视觉走查通过 |
| ② 粒子 + 动画 | ParticleScene（shader 粒子 + 密度分档 + dispose）、ParticleBackground 接入 App、Hero 入场时间线、useGsapReveal、移动端/reduced-motion 降级 | 桌面 60fps；路由切换无泄漏（Performance 面板无累积）；移动端降级生效<br>+ 人工确认：`npm run dev` 和 `npm run build` 无报错，视觉走查通过 |
| ③ 真实内容 | profile.ts / projects.ts 填真实数据、项目截图、写 2-3 篇示例博客、卡片组件细化（倾斜卡/glare 可选） | 内容齐全；改数据不需改组件<br>+ 人工确认：`npm run dev` 和 `npm run build` 无报错，视觉走查通过 |
| ④ 部署上线 | git init + 新仓库、deploy.yml、Pages 配置、404 处理（scripts/postbuild.mjs + index.html 恢复脚本）、Lighthouse 验证 | 线上可访问、刷新不 404、Lighthouse ≥ 90<br>+ 人工确认：`npm run dev` 和 `npm run build` 无报错，视觉走查通过 |

顺序原则：先骨架 → 再粒子动画 → 再填内容 → 最后部署（用户既定步骤）。

## 10. 内容素材清单（阶段 ③ 前准备完毕）

在开始阶段 ③ 之前，需要准备以下真实内容：

| 素材 | 规格 | 用途 | 放置位置 |
|---|---|---|---|
| 头像 | 正方形，≥ 400×400px，PNG/WebP | 首页 Hero、关于页 | `public/images/avatar.webp` |
| 个人简介 | 2-3 句话，一句话版本 + 一段详细版本 | Hero 副标题 + 关于页 | `src/data/profile.ts` |
| 技能标签 | ≤ 10 个，可含熟练度（如 熟练/了解） | 关于页 | `src/data/profile.ts` |
| 项目截图 | 2-3 张，WebP，16:9 或 4:3，单张 < 200KB | 项目卡片 | `public/projects/*.webp` |
| 项目信息 | 每个项目：标题 + 3-5 句描述 + 技术栈标签 + GitHub 链接（可选演示链接） | 项目页 | `src/data/projects.ts` |
| 博客文章 | 2-3 篇，Markdown，frontmatter 完整 | 博客页 | `src/blog/*.md` |
| 社交链接 | GitHub、邮箱（必选）；其他按需 | 全局导航 + Hero | `src/data/profile.ts` |
| favicon | SVG 或 32×32 PNG | 浏览器标签页 | `public/favicon.svg` |

**验收标准**：以上素材全部就位后，才开始阶段 ③；中途不新增素材种类。

## 11. 风险与对策

| 风险 | 对策 |
|---|---|
| 移动端粒子卡顿/发热 | 密度分档已内置：移动端关闭或 ≤ 200；visibilitychange 暂停 |
| WebGL 不可用 | 检测回退 CSS 渐变背景 |
| SPA 子路由刷新 404 | sessionStorage 重定向方案（§8.3，嵌套路由安全） |
| shiki/markdown-it 拉大首屏 | 仅 BlogPostView 动态 import，与首屏包隔离 |
| 中文排版 FOUT | 系统字体栈，不引 webfont |
| Tailwind 自定义色静默失效（devportfolio 踩过） | 颜色一律走 `@theme` 令牌定义，不写未定义类 |
| 依赖版本 API 变化（Tailwind 4 / Vite 8 等） | 每个阶段开始前用 ctx7 拉取对应库最新文档核对 API |

## 12. v1.1.0 内容增强计划（2026-08-14）

**背景**：v1.0.x 上线后用户反馈"内容偏简陋"。调研 20+ 个国内外个人站（中文内容型站、国际知名作品集、交互亮点站，含国内网络可达性实测）后，结论：差距不在页面数量，而在**每页信息密度**——标杆站首页普遍 4-6 个板块，本站只有 Hero。

**范围**（用户勾选确认）：
| 包 | 内容 |
|---|---|
| 首页扩版 | Hero 座右铭一句 + 精选项目区（复用 featured 项目）+ 最新文章区（复用博客前 3 篇） |
| 关于页强化 | 简介扩成 4 段式（定位/现在/过往/爱好，代拟初稿待用户审）；纯 CSS 时间线 4-6 节点（基于公开事实，细节待用户补） |
| 打字机+进度条 | 自写 `useTypewriter` composable（不引依赖）；文章页阅读进度条 + 字数/阅读时长（`lib/blog.ts` 计算 + 单测） |
| 快捷键面板 | `CommandPalette.vue`（`?`/`K` 唤起：g+h/g+b/c 复制邮箱） |
| 彩蛋包 | catch-all 路由 → 终端风 404 页（`command not found: /xxx`，顺带修复未知路径空白页）；Konami 码触发横幅 |
| 评论+统计 | giscus 评论（点击后懒加载 iframe）；GitHub 统计由 Actions 构建时用 `GITHUB_TOKEN` 拉 api.github.com 写静态 JSON + 每日 cron（不依赖被墙的 Vercel 服务） |

**约束（沿用 §1 核心原则）**：性能优先克制动画；所有新动画走 transform/opacity 且尊重 `prefers-reduced-motion`；零新运行时依赖（打字机自写）；第三方请求全部懒加载（giscus 点击才加载）。

**需用户提供**：① 时间线真实细节（学校/竞赛名次/里程碑时间）；② giscus 一次性配置（开启 Discussions → giscus.app 拿参数）；③ 4 段式简介的审改。

**验收标准**：`npm test`/`npm run build` 全绿；桌面 5 页 + 404 页 vision 走查通过；giscus 评论区懒加载生效（配置完成后）；首页从 1 板块增至 4 板块；部署 v1.1.0 后线上复验。

## 13. v1.2.0 视觉质感增强计划（2026-08-14）

**背景**：用户提供 4 个参考站（continueyn.site / qqhamburger.top / mypresentboxes.com / bzdshumo.com）要求头脑风暴借鉴。调研结论的核心原则：**深色星空底上的高级感来自"层级"（字号差/透明度差/细线），而非堆装饰**。不照搬，全部改写为符合本站星空主题的版本。

**范围**（用户勾选确认，分三轮实施）：
| 轮次 | 项 | 灵感来源（改写后） |
|---|---|---|
| R1 排版包 | ① 双语 section 标题（英文 over-title + 中文主标）② Hero 微型档案行（hairline 列表）③ 项目卡英文 over-label + 状态竖条 ④ 页脚平台矩阵 + ↑ TOP ⑤ 幽默空态文案（星空拟人版"墨水还在路上"） | mpb 杂志层级、bzd 双语标题制与金色竖条索引、qqhamburger 空态幽默 |
| R2 视觉亮点 | ⑥ Hero 名字渐变发光（glow-text 加大字号）⑦ 博客目录行式列表（分类+日期/标题/↗）⑧ 统计数字滚动动画（IO 触发 0→N）⑨ 项目板块描边背景字 marquee（PROJECTS // 作品） | continueyn 书法名与描边字、mpb 目录行 |
| R3 大件 | ⑩ 三步逛站卡（01 看项目→02 读博客→03 找 GitHub）⑪ 漂浮成就纸片（项目截图+蓝桥杯文字纸片，rotate+低透明度）⑫ 粒子主星导航（6-8 颗主星 hover 光晕+板块名，raycast 点击跳转；顶部导航保留作可访问性兜底） | bzd 步骤卡与证书墙、qqhamburger 3D 入口的渐进式降级版 |

**约束**：延续 §1 核心原则；新增动画全部 transform/opacity 且尊重 prefers-reduced-motion；主星导航在 pointer:coarse 设备禁用交互；数据全部走 src/data（项目 over-label/状态、档案行内容、平台矩阵说明均为数据字段）；不引入 webfont/新依赖。

**验收标准**：`npm test`/`npm run build` 全绿；每轮浏览器 + vision 截图走查；移动端布局无回归；粒子主星导航 raycast 命中率与性能（8 点 pointermove 无感）；部署 v1.2.0 后线上复验。

## 14. v1.3.0 星空渲染进阶包（2026-08-15）

**背景**：用户反馈渲染设计需加强。调研（three r185 源码核对 + Codrops galaxy 文 + GitHub starfield 项目）结论：现有 procedural 光斑粒子方向正确，升级分三档；用户选择**进阶包**。

**范围**（进阶包 = 保守包全部 + 四项新对象）：
| 项 | 做法 |
|---|---|
| 闪烁 twinkle | frag 复用 aSpeed/aDrift 作相位频率，alpha × (0.75~1.0)，幅度克制 |
| 暖色金星 | 新 attribute aWarm（~5% 概率=1）+ uColorC 琥珀色三维 mix |
| 主星十字星芒 | 新 attribute aNav（nav=1）+ frag 四芒衍射项（smoothstep 细条 × exp 衰减），aHover 同步增强 |
| 星云雾霭层 | 12-20 个 THREE.Sprite（canvas 生成 256px 径向渐变纹理 + SpriteMaterial color 染色），opacity 0.04-0.09，慢速漂移，随密度隐藏 |
| 景深分层 | 粒子重构为 3 层（620/280/100，近大远小、速度分层），每层独立 Group 带视差系数；setDrawRange 按层按比例缩放（低密度档保持分层感） |
| 流星 | 独立 40 顶点 Points + 专用小 shader（uTime mod 周期 40-70s，头部亮点尾部指数衰减），reduced-motion/移动端隐藏 |
| 鼠标排斥场 | vert 加 uMouse/uRepelRadius/uRepelStrength，ParticleScene 提供 setRepelPoint(clientX,clientY)（内部 unproject + 场景旋转逆变换）；coarse/reduced-motion 时强度归零 |

**约束**：不引新依赖（THREE.Sprite 内置）；公开 API 不变（init/setDensity/setMobile/setReducedMotion/setParallaxTarget/setNavStarHover/pickNavStar/navStarScreenPositions/dispose）；渲染主循环不动；总粒子数 1000 不变；dispose 需覆盖新对象（Sprite material/texture、流星 geometry）；性能验收：桌面 rAF 不降（实测 ≥140 回调/s）、移动端照旧关闭。

**验收标准**：`npm test`/`npm run build` 全绿；桌面/移动/文章页三场景 vision 截图对比（星云底衬、分层纵深、流星、暖星可见）；reduced-motion 静态帧正常；部署 v1.3.0 后线上复验。

## 15. v1.4.0 趣味交互增强计划（2026-08-15）

**背景**：用户要求页面设计/布局更创新有趣生动美观，提供同学站源码（ContinueYN/website_3.0，已做代码级拆解）并授权广搜参考。两路调研（同学源码拆解 + Awwwards 类创意站源码通读）共 20+ 候选，用户勾选 9 项。

**范围**（全部改写为星空主题版，不照搬）：
| 组 | 项 | 灵感来源（改写后） |
|---|---|---|
| 高感知 | ① 流星光标（四芒星跟随+拖尾+hover 语义气泡，移动端禁用）② SVG 描边标题（hero 名字描边书写动画，pathLength=1 文本描边方案，无字体文件）③ 混排弹性大标题（hero 第二行衬线斜体点缀 + 逐字 elastic 弹入组件） | Truus CursorBubble、同学站 Hero drawPath、Truus HorizontalWords |
| 转场卡片 | ④ 流星划痕转场（SVG 轨迹划入满屏划出，叠加现有交叉淡入）⑤ glitch 标题（关于页点击撕裂）+ 流星尾迹滚动进度条（导航底）⑥ 磁吸惯性卡片（hover 微倾+甩动归位+彗星贴纸入场） | Truus TransitionScribble、同学站 glitch/scroll-progress、Truus MotionCards |
| 特色玩法 | ⑦ 打字即流星（全局击键撒微流星，限速）⑧ 版本星图档案页（/versions 星图时间轴 + 页脚版本徽章 + index.html ASCII 彩蛋）⑨ 星系横移项目区（GSAP pin 横滚，桌面限定，移动端纵向退化） | 3D_portfolio 输入联动降维、lynnandtonic 版本叙事、同学站 Projects pin |

**约束**：延续 §1 核心原则；新动画全部尊重 prefers-reduced-motion；移动端（coarse/<768）禁用光标/惯性/横移；转场不替换现有交叉淡入（避免重蹈 out-in 卡死）；SVG 描边用 pathLength=1 文本方案；不引入新依赖（GSAP/Three 已有）。

**验收标准**：`npm test`/`npm run build` 全绿；每项浏览器 + vision 走查；帧率不降（≥140 rAF/s）；导航往返 3 次无空白回归；部署 v1.4.0 线上复验。
