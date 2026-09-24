# Starlight · 星港

> ✦ the stars remember every commit —— 一个深空主题的个人网站：算法竞赛题解库、项目展示与一点点浪漫。

**在线访问**：<https://xrk-hhh.github.io/starlight/>

## 这是什么

用 **Vue 3 + TypeScript + Vite + Three.js + GSAP + Tailwind CSS v4** 搭建的 SPA 个人站点，部署在 GitHub Pages。从设计文档到任务拆解、实现、视觉验收、部署，全程由 AI Agent 工作流（deepseek-v4-pro + Claude Code，近期 deepseek harness × deepseek-v4-flash）驱动开发。

## 功能地图

**内容**
- 📚 博客知识库：36 篇文章（31 篇算法题解，含难度星级 1~5、来源均为本人真实提交）+ 两级标签（分类 → 知识点）+ 搜索 + 归档时间线 + 随机漫游
- 📖 阅读体验：文章 TOC scroll-spy、代码高亮（One Dark Pro，shiki）、复制按钮、图片 Lightbox、←/→ 翻篇、相关文章推荐
- 🎯 今日一题：按日期确定性轮换的算法题推荐
- 🛠 项目星轨：原生横向滚动轨道（拖拽/方向键/按钮），真实运行截图封面
- 📊 算法星域：洛谷 / 牛客竞赛真实数据（CI 自动拉取）
- ✨ 贡献星图：近一年 GitHub 提交热力图（星星版）
- ☁️ 技能星云：SVG 雷达图（刻度环渐入 / 四芒星顶点 / hover 轴联动）

**设计**
- 🎨 五套主题（v2.11 场景化）：深空星港 / 落日熔金 / 极光冰川 / 月白纸笺 / 樱庭薄暮——粒子·星云·流星随主题换色，每主题独立氛围层（落日日轮余晖 / 极光帘幕漂移 / 纸笺衬线字体 / 樱瓣飘落）；全站 SVG/着色硬编码冷色已清零（glitch/hero 渐变/星云/唱片/启动 spinner 随主题换色，落日代码块暖化），浅色主题全量适配
- 🐉 桌宠奶龙 / 奶蛙：原版表情包精灵表动画（erich207 & timerring 素材）——拖拽甩出惯性滑行、边缘反弹、散步跟随光标（悬停暂停）、投喂粒子、时段问候、点击 Q 弹
- 🎵 星港电台（v2.15.3 三铁律）：①`play()` 只在点击手势内发起（await 网络会被 autoplay 策略拒绝）②播放中永不换源（未出声元素换源续播会被拒绝且静默死掉）③不双下载（渐进流播放时中止后台 fetch——同一文件两条连接会互相抢带宽）——悬停预取 blob 秒播（实测 <0.5s）、慢网首播显示「信号缓冲中」、暂停后空闲重挂预取；WebAudio 真频谱均衡器 + 播放/暂停音量渐变，切页不断播（Ethereal Relaxation — Kevin MacLeod, CC BY 4.0；音源 1.6MB/160kbps，若需进一步提速可用 ffmpeg 重编码 112kbps 至 ~1.1MB）
- 🌌 GPU 粒子星海：三层视差 + 流星 + 排斥场 + 主星导航（可见性暂停 / reduced 静帧）
- 🗺 版本星座：发版历史排成一条星轨，点击星定位日志
- 🖥 星港终端：Now 页飞行日志逐行打出
- 🎇 细节：命令面板（`?`）/ 全局快捷键（`g` 前缀跳页 · `r` 随机漫游 · `c` 复制邮箱，中文输入法兼容）/ Konami 彩蛋 / 打字流星 / 失焦标题 / 星港边缘 toast / hero 视差

**互动**
- 💬 双通道留言：公开评论走 giscus（GitHub Discussions，滚动预载 + 主题跟随 + 慢网降级出口）；私密信件走「联络信使」表单（姓名/邮箱/主题/消息，**Web3Forms 在线直投**——无需邮件客户端，服务不可达时自动降级 mailto，草稿自动留存）
- 🎊 电报彩蛋「传输仪式」（v2.14）：发送成功后三段式传输状态（电波发射 → 深空中继 → 星港签收），签收瞬间流星护航，你的电波化作「回执卡」挂进深空讯号区（仅本次会话可见）

**基础设施**
- RSS（atom.xml，36 篇）+ sitemap.xml + robots.txt：postbuild 构建期生成
- CI：GitHub Actions 定时+推送部署；构建前拉取 GitHub/OJ 统计；Node 24
- 性能：首屏 JS 按需加载（粒子/语法包/音频全部 idle 或路由级）、**博客数据构建期分层（v2.18）**——列表/统计走构建期 frontmatter 元数据（blog chunk 225KB→19KB，gzip -92%），36 篇全文按篇懒加载（单篇 2-6KB）、运行时零 js-yaml、wasm 零依赖（shiki JS 引擎）、CLS 0、axe 清零

## 快速开始

```bash
npm install
npm run dev        # 开发（base 为 /）
npm test           # vitest
npm run lint       # eslint
npm run build      # 构建到 dist/（含 atom.xml / sitemap 生成）

# 本地预览生产构建（注意 base）：
npx vite preview --base /starlight/
```

> Windows + Git Bash 提示：`--base /starlight/` 参数需 `MSYS_NO_PATHCONV=1` 前缀防路径转换。

## 目录结构

```
src/
├── views/          # 路由页面（Home/About/Projects/Blog*/Now/Friends/Guestbook/Versions/404）
├── components/
│   ├── ui/         # 星云/星图/统计/电台/主题切换/今日一题 等
│   ├── overlay/    # 桌宠/命令面板/流星光标/流星转场
│   ├── particles/  # WebGL 粒子背景
│   └── blog/       # Giscus 评论
├── composables/    # 主题/视差/reveal/惯性倾斜/打字机/计数 等
├── blog/           # 36 篇 Markdown 文章（frontmatter: title/date/tags/category/difficulty）
├── data/           # profile / projects / friends / oj / site（版本单一源）
├── lib/            # markdown 渲染（shiki One Dark Pro）/ 博客解析（CRLF 兼容）
└── three/          # ParticleScene（三层星海）
scripts/            # fetch-github-stats / fetch-oj-stats / postbuild(RSS+sitemap)
public/images/blog/ # 30 张自绘 One Dark 风格 SVG 讲解图（过三重布局检查）
```

## 写作约定

- 文章放 `src/blog/`，文件名 `YYYY-MM-DD-slug.md`；frontmatter 需含 `title/date/tags/desc`，算法题解加 `category: 算法竞赛` 与 `difficulty: 1-5`
- 示意图放 `public/images/blog/`，引用前过布局检查（文本相交 / 越界 / 遮挡）
- 新增主题：在 `src/composables/useTheme.ts` 的 `THEMES` 加一项（swatch + scene 场景色板 + light 标志 + giscus 主题），再在 `src/styles/main.css` 补 `html[data-theme='…']` 变量与氛围层、`index.html` 首帧脚本加 key

## 常用改动速查表

| 想改什么 | 去哪里改 | 注意 |
|---|---|---|
| 发新版本 | `node scripts/release.mjs "vX.Y.Z" "note"` 一条命令（改 site.ts/footer/插入版本星图并自校验） | 条目必须**字面量**（禁 SITE_VERSION 引用，测试源码级断言）；CRLF 曾致七条记录丢失，脚本按行处理免疫 |
| 加/换友链 | `src/data/friends.ts`（前 3 位进内圈轨道，其余进外圈） | 同步核对下方卡片描述 |
| 写新文章 | `src/blog/` 新建 `YYYY-MM-DD-slug.md` | atom.xml / sitemap 由 postbuild 自动收 |
| 换背景音乐 | `public/audio/starlight-theme.mp3` + `MusicPlayer.vue` 曲目名文案 | 音乐需可自由使用（当前 CC BY 4.0） |
| 换 Web3Forms key | `gh secret set VITE_WEB3FORMS_ACCESS_KEY` + 本地 `.env` | 重新部署后生效 |
| 调粒子/星空 | **不要动**——粒子栈与 v2.11 逐字节一致（用户认证行为） | 改前先在真实浏览器多主题验证 |
| 评论区 | `src/config/giscus.ts` | 主题跟随站点（light/dark 自动） |

## 联络信使（Web3Forms 直投）

留言板的「联络信使」表单已配置 **Web3Forms 在线直投**：访客填写姓名/邮箱/主题/消息后点击「发送电报」，邮件直接送达站长邮箱，全程不离开站点、不唤起邮件客户端。服务不可达时自动降级 mailto（预填邮件），访客永远有出路；草稿自动留存本机。

密钥管理（已配置，供换 key 时参考）：

- **生产构建**：密钥存于仓库 Actions secret `VITE_WEB3FORMS_ACCESS_KEY`，`deploy.yml` 构建时注入（见 Build 步骤的 env）
- **本地开发**：项目根目录 `.env`（已被 .gitignore 忽略）写入 `VITE_WEB3FORMS_ACCESS_KEY=…`
- 换 key：[web3forms.com](https://web3forms.com) 重新生成 → `gh secret set VITE_WEB3FORMS_ACCESS_KEY` 更新 → 本地 `.env` 同步 → 重新部署

## 致谢与许可

- 奶龙桌宠精灵表：[erich207/nailong-codex-pet](https://github.com/erich207/nailong-codex-pet)（原版奶龙）
- 奶蛙精灵表：[timerring/codex-pet-naiwa](https://github.com/timerring/codex-pet-naiwa)
- 背景音乐：Ethereal Relaxation — [Kevin MacLeod](https://incompetech.com)（[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)）
- 题解中的代码均为本人在洛谷 / 牛客 / AtCoder / Codeforces 的真实提交

## License

代码 MIT；文章与原创插图版权归作者所有。
