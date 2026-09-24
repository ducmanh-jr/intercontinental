# 个人网站实现提示词（交付给 Agent 的完整规格）

> 用途：把本文档整体交给一个新的 AI Agent，即可从零复现本网站（starlight 深空主题个人站，v1.4.0 规格）。
> 仓库：https://github.com/xrk-hhh/starlight · 线上：https://xrk-hhh.github.io/starlight/

---

## 一、目标

搭建一个**深色星空主题**的个人网站（纯中文内容），包含 7 个路由页面，部署到 GitHub Pages 子路径（`/starlight/`）。整体气质：**科技感 + 浪漫星空，性能克制，交互有趣但不堆砌**。

## 二、技术栈（精确）

| 层 | 选型 | 注意 |
|---|---|---|
| 框架 | Vue 3 `<script setup>` + TypeScript + Vite | |
| 路由 | vue-router 5 | **不是 v4**；`RouteMeta` 自定义字段需 `declare module 'vue-router'` |
| 样式 | Tailwind CSS v4（`@tailwindcss/vite` 插件，CSS-first `@theme` 令牌，无 config 文件） | 自定义色必须走 `@theme` 定义，否则类名静默失效 |
| 3D | Three.js 原生（不引 TresJS） | 场景为纯 TS 类，与 Vue 解耦 |
| 动画 | GSAP 3 + ScrollTrigger（按需注册） | 全部包 `gsap.context(fn, scope)`，卸载 `ctx.revert()` |
| 博客 | markdown-it + shiki + **js-yaml**（frontmatter） | **不要用 gray-matter**（依赖 Node Buffer，浏览器空白）；js-yaml v5 用 `import { load } from 'js-yaml'` |
| 测试 | Vitest（node 环境 + 浏览器关键路径用 `// @vitest-environment jsdom`） | |
| 部署 | GitHub Actions → GitHub Pages | base 构建态 `/starlight/`、dev 态 `/` |

**明确不引入**：Lenis、GLB 模型、音效文件、Pinia、UI 组件库、TresJS、vite-plugin-glsl、@unhead、webfont 字体、双主题。

## 三、设计令牌（@theme）

```
--color-bg: #0a0a12       --color-surface: #12121e
--color-primary: #22d3ee  --color-accent: #8b5cf6
--color-text: #f4f4f5     --color-text-muted: #9ca3af
--font-sans: 中文系统字体栈（PingFang SC / Microsoft YaHei / Noto Sans CJK SC / system-ui）
--font-mono: JetBrains Mono（系统已装则用，不引 webfont）
```

复用组件类：`.card`（圆角边框白 10% + surface）、`.glow-text`（青→紫渐变字）、`.btn-primary`、`.section-container`（max-w-5xl px-6 py-24）。HTML 背景放**body** 上的双 radial-gradient（青/紫环境光）作为 WebGL 兜底（勿放 html——会被 body 背景盖住）。

## 四、页面规格

### 首页 `/`（密度 high，粒子 1000）
1. Hero：身份行（mono 小字）→ 名字 **SVG 描边书写动画**（`<text>` 元素，`stroke-dasharray/offset: 2500` 大 dash 方案 2.4s 描边 → 3.0s 后渐变填充；**pathLength 对 text 无效，禁用**）→ 座右铭 → 打字机副标题（自写 composable 循环打字，reduced-motion 静态）→ 双 CTA → 微型档案行（TECH/FOCUS/NOW/UPDATED hairline 列表）→ 混排弹性大标题（逐字 elastic 弹入 + 衬线斜体英文点缀行）。
2. 精选项目（紧凑入口行：标题+一行摘要+GitHub →）+ 最新文章（日期+标题入口行），均带"查看全部 →"。
3. 三步逛站卡（01 看项目 / 02 读博客 / 03 找 GitHub）。
4. 页脚：平台矩阵（品牌 slogan + 导航/联系两列 + © 行 + 版本徽章链 /versions + 快捷键提示）。

### 关于 `/about`（low，300）
标题（**glitch 点击撕裂**：点击后 900ms 青/紫双色重影 + clip-path 抖动）→ 头像 + 4 段简介（数据驱动）→ 时间线（border-l 竖线，date mono + 标题 + 描述，数据驱动）→ 漂浮成就纸片（蓝桥杯文字卡 + 2 张项目截图缩略，rotate ±2-6°、opacity-70、md 以上显示）→ 技能标签（≤10 个）→ 社交链接（mailto 不加 target=_blank）→ GitHub 统计行（fetch `BASE_URL + github-stats.json`，失败静默隐藏；数字 IO 触发滚动计数动画，reduced-motion 直达终值）。

### 项目 `/projects`（low）
SectionTitle（英文 over-title + 中文主标）→ 背景描边字 marquee（`PROJECTS // 作品` 双份无缝循环 40s，reduced 停）→ **星系横移**：桌面 ≥1024px 用 GSAP ScrollTrigger pin 横滚（卡片 420px、默认 opacity-70 blur 失焦、hover 对焦），移动端/ reduced-motion 纵向 grid。项目卡：截图 + over-label（mono 小字）+ 标题 + 描述 + 标签（**按数量/长度自适应**：≤3 个大号、>3 个缩小、>14 字符 truncate+title）+ 3px 状态竖条（active 渐变 / done 灰）+ GitHub 链接。

### 博客列表 `/blog`（low）
目录行式列表（日期列 + 标题 + ↗，hairline 分隔，hover 标题左移变色）；空态拟人文案（🛰️"信号还在深空漂移……"）；SectionTitle over="Blog"。

### 博客详情 `/blog/:slug`（off，无粒子）
标题（h1 来自 frontmatter title，正文勿重复 h1）+ 日期/标签/字数阅读时长（`约 N 字 · 阅读 M 分钟`，中文按字、英文按词、代码块不计，400 字/分取整 min 1）+ 顶部阅读进度条（z-60 以上，防被导航栏盖）+ markdown 正文（`html:false` 防 XSS，shiki 代码高亮只在**本页懒加载**，不进水首屏）+ giscus 评论区（**点击后才加载 iframe**，未配置时显示提示）。

### 版本档案 `/versions`（low）
星图时间线（v1.0.0 → 当前，每个版本：版本号 mono + 日期 + 一句话变更，当前版 ● NOW）。

### 404（catch-all 路由，low）
终端风：`$ cd /xxx` + `404: command not found: /xxx` + 返回首页。**必须在** `/:pathMatch(.*)*` catch-all 之前放正常路由。

## 五、全局系统

### 粒子背景（App 级挂载一次，路由不重建）
- **GPU 粒子**：运动属性（offset/radius/speed/drift/size/colorMix）进 BufferAttribute，vertex shader 计算，CPU 每帧只更新 uTime；`AdditiveBlending + depthWrite:false + frustumCulled:false`；shader 用 `?raw` 导入。
- **三层景深**：远 100 / 中 620 / 近 280（baseCount 总计 1000），每层独立 Group + 视差系数；密度分档按 `setDrawRange(0, floor(baseCount × ratio))` 每层等比缩放。
- **密度分档**：high=1000 / low=300 / off=0；**off 时 `renderer.clear()` 清屏**（否则残留"冻结星空"）；移动端 <768 一律 0。
- **进阶要素**：twinkle（aSpeed/aDrift 相位，幅度 0.75-1.0）、暖星 aWarm 5%（uColorC #fbbf24）、星云雾霭层（12-20 个 THREE.Sprite 慢漂移，opacity 0.04-0.09）、流星（40 顶点独立 Points，uProgress = mod(elapsed/50+0.13, 1)，reduced-motion **隐藏**）、鼠标排斥场（vert 内径向推移，uMouse 用中层 Group 逆旋转换算）。
- **主星导航**：6 颗大星（aNav=1 + 十字星芒 frag 项 + aHover 放大）；pointermove raycast（threshold 2.0——星体有 shader 漂移），hover 显示 label（HTML 层，投影位置需**复现 shader 漂移 + applyEuler(scene 旋转)**）；点击跳转（**重 pick 而非信任 hoverIdx**，且 `e.target.closest('a,button,...')` 守卫防双触发）；coarse/reduced 禁交互；主星**不参与排斥场**（保 hover 稳定）。
- **打字即流星**：全局 keydown（`e.key.length===1` 且忽略 Ctrl/Meta/Alt，120ms 限速）触发 `burstMeteor()`。
- **生命周期**：dispose 幂等——cancelAnimationFrame → 移除 resize/visibilitychange 监听 → traverse 递归 dispose（含 Sprite 材质与共享纹理）→ renderer.dispose → 引用置 null。

### 全局交互层
- **流星光标**：四芒星跟随（rAF 指数趋近 0.22）+ 3 个渐隐拖尾点 + hover 语义气泡（**用 `new URL(href, origin).pathname` 匹配，兼容构建 base**；/blog→阅读、/projects→探索、首页→返航、其余→GO）；coarse/reduced 不挂载。
- **流星划痕转场**：router.afterEach 触发全屏 SVG 弧线划入→划出（0.85s）；**`vector-effect="non-scaling-stroke"` 时 dasharray 用宿主坐标 `Math.hypot(innerWidth, innerHeight)`**，play 时重新计算；pointer-events-none；reduced 跳过。
- **页面切换过渡**：**禁用 `Transition mode="out-in"`**（与 v-slot + `:key="route.path"` 组合会卡死退场→空白无报错）。用默认 mode + `.page-leave-active{position:absolute;inset-inline:0;top:0}` 交叉淡入；**页面组件必须单根节点**（多根会静默跳过过渡类）。
- **导航加载条**：`navigating` 状态 **beforeEach 置 true、afterEach 置 false、onError 兜底清除**（beforeResolve 时机太晚，覆盖不了分包下载窗口）。
- **分包预取**：空闲时（requestIdleCallback）遍历 `router.getRoutes()`，`Object.values(r.components)` 逐项调用并 catch 静默（vue-router 5 的 components 是 Record，不是数组）。
- **快捷键面板**：`?` 打开（INPUT/TEXTAREA/contenteditable 忽略）/ esc 关闭 / g+h,a,p,b 跳转 / c 复制邮箱（从 profile.socials 推导，非硬编码）；z-80。
- **彩蛋**：Konami 码（↑↑↓↓←→←→BA）横幅 3s；HTML 注释 ASCII 星座图。
- **首屏 boot-hint**：index.html 内联（黑底 spinner + "正在进入星港…"），main.ts mount 后淡出移除。

### 无障碍与降级
所有动画尊重 `prefers-reduced-motion`（粒子静态帧、光标/惯性/横移禁用、描边直达终态）；`pointer:coarse` 或 <768 禁用光标交互；`aria-hidden` 覆盖装饰元素；ElasticHeading 用 `:aria-label` 全文 + 全部 span aria-hidden。

## 六、数据与内容（改内容不改组件）

```
src/data/profile.ts   # name/title/motto/introShort/introLong/avatar/skills/socials/quickFacts/timeline/typedPhrases
src/data/projects.ts  # Project[]: slug/title/description/tags/image/github/demo?/featured?/over?/status?
src/blog/*.md         # frontmatter: title/date/tags/desc；正文无 h1
```

博客管道：`import.meta.glob('../blog/*.md', { query: '?raw', import: 'default', eager: true })`（`as:'raw'` 已被 Vitest 4 弃用）→ js-yaml 解析 frontmatter → 列表按 date 倒序。组件零硬编码个人文案；站点结构文案（导航名/板块标题/CTA）允许。

## 七、性能预算（验收硬指标）

| 指标 | 值 |
|---|---|
| 首屏 JS gzip | < 300KB（实测 ~145KB；markdown-it/shiki 只进博客详情分包） |
| 粒子 | 桌面 ≤1000 全 GPU；CPU 每帧仅 uniform |
| DPR | `Math.min(devicePixelRatio, 2)`（init 与 resize 两处） |
| 渲染暂停 | `visibilitychange` 时停 rAF |
| 动画 | 只动 transform/opacity |
| Lighthouse | Performance ≥ 90（CHROME_PATH 需指向已装 Chrome） |
| 图片 | webp、本地存放、lazy、固定宽高防 CLS |

## 八、部署（GitHub Pages 子路径）

- 仓库 `xrk-hhh/starlight`；`dev` 日常开发 → 验收 → merge `main` 触发部署；默认分支 **main**。
- `vite.config.ts`：`base: command === 'serve' ? '/' : '/starlight/'`（createWebHistory 需要绝对 base）。
- **404 回退链**（嵌套路由刷新）：postbuild 复制 `index.html` → `404.html` 并注入重定向脚本（`pathname.split('/')[1]` 算仓库根，**禁用 `new URL('.')`**）；恢复脚本放 index.html `<head>` 最前、同步、**delete 必须在 guard 内**（无条件 delete 会毁掉整条链）。
- `scripts/fetch-github-stats.mjs`：CI 构建时用 GITHUB_TOKEN 拉 api.github.com 写 `public/github-stats.json`；workflow 加每日 cron。
- **环境分支策略**：首次部署失败常见原因——github-pages environment 的 deployment branch policy 默认只允许当时默认分支；用 `gh api` 配置允许 main。
- 构建门：`vue-tsc -b && vite build`（**`vue-tsc --noEmit` + solution tsconfig 不检查 src**，根 tsconfig 必须引用 app+node 两工程；typescript 固定 ^5.9.x——7.x 与 vue-tsc 不兼容）。

## 九、已知陷阱清单（每条都真实踩过，照做即可避坑）

1. `Transition mode="out-in"` + v-slot + key → 退场卡死空白无报错；验收必须用**真实点击导航**而非直接输 URL。
2. SVG `pathLength` 对 `<text>` 无效 → 描边书写用大 dasharray。
3. `vector-effect="non-scaling-stroke"` 改变 dash 坐标空间 → 宿主空间长度。
4. gray-matter 依赖 Node Buffer → 浏览器空白；测试跑 node 环境掩盖问题 → 关键路径加 jsdom 测试。
5. 粒子密度 off 不 clear → 冻结星空残帧。
6. 404 恢复脚本无条件 delete → 重定向链断裂（死循环或丢深链）。
7. `beforeResolve` 在分包下载后触发 → 进度条覆盖零窗口，用 beforeEach + onError。
8. 生产 base 与 dev 不同 → 所有 href 语义匹配必须 BASE_URL 感知。
9. MediaQueryList add/remove 必须同一实例引用（新建实例无监听器 → 泄漏）。
10. 页面组件多根节点 → Transition 静默失效 + Vue 警告。
11. `gsap.context` 的作用域选择器只查组件内；`data-reveal` 元素若在异步插入（fetch 后）不会被 reveal 扫到。
12. html 上的 CSS 渐变会被 body 不透明背景盖住 → 兜底放 body。
13. 字体零 webfont；中文按字拆分动画时用 aria-label 保持可读。

## 十、验收方法

1. `npm test`（vitest 全绿）+ `npm run lint` + `npm run build`（vue-tsc -b 真实生效——用"注入错误必须失败"双探针验证）。
2. 浏览器**真实点击**导航往返 3 次：每页 URL 与内容都正确（防过渡卡死回归）。
3. 桌面 rAF 采样 ≥140 回调/s（粒子+动画全开）。
4. 截图 + 视觉模型走查每个页面（vision 能发现代码审查看不到的渲染问题）。
5. 移动端 <768：粒子关闭、横移退化纵向、光标/惯性禁用、布局无溢出。
6. 部署后线上复验：子路由直接刷新 URL 保持且内容渲染（404 链）、资源 200、Lighthouse ≥90。

## 十一、风格参考（校准气质用，不照搬）

- continueyn.site（同学站）：SVG 描边书法、glitch 标题、滚动进度条——交互结构借鉴，配色映射到青紫体系。
- qqhamburger.top：导航隐喻、幽默空态、主题化文案——思路级参考。
- mypresentboxes.com：杂志层级（字号差/细线/双语标签）。
- bzdshumo.com：统计带、时间胶囊、步骤卡。
- Truus/Fizzi（Awwwards 类）：光标气泡、划痕转场、弹性标题、轨道文字。

---

**一句话总结给 Agent**：星空深色个人站，性能预算硬约束（首屏 <300KB、粒子 GPU 化、动画只动 transform/opacity），所有交互尊重 reduced-motion 与移动端降级，数据与组件分离，部署走 GitHub Actions 子路径 + 404 回退链；第九节陷阱清单是血泪教训，逐条照做。
