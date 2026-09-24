export interface Project {
  slug: string
  title: string
  description: string
  tags: string[]
  image?: string
  github?: string
  demo?: string
  featured?: boolean
  over?: string
  status?: 'active' | 'done'
}

export const projects: Project[] = [
  {
    slug: 'galaxy-defender',
    title: 'Galaxy Defender',
    description:
      '纵向卷轴太空射击 + Roguelike 升级游戏。操控飞船在星空中战斗——消灭敌人、收集宝石、躲避弹幕和陨石，每波结束从 3 个永久升级中三选一，每 5 波迎来 Boss 战，死亡后结算排行榜。Java Swing 实现，可打包为自包含可执行文件。',
    tags: ['Java', 'Swing', '游戏开发'],
    image: 'galaxy-defender.webp',
    github: 'https://github.com/xrk-hhh/Galaxy-Defender',
    featured: true,
    over: 'JAVA · SWING',
    status: 'done',
  },
  {
    slug: 'art-style-transfer',
    title: 'Art Style Transfer',
    description:
      'AI 艺术风格迁移桌面应用，PySide6 + OpenCV 实现。内置六种艺术风格滤镜，支持云端 AI 与本地离线双引擎：离线时用 OpenCV 快速迁移，联网时调用云端模型获得更高质量的效果。',
    tags: ['Python', 'PySide6', 'OpenCV', 'AI'],
    image: 'art-style-transfer.webp',
    github: 'https://github.com/xrk-hhh/Art-Style-Transfer',
    featured: true,
    over: 'PYTHON · AI',
    status: 'done',
  },
  {
    slug: '2048-strategy-arena',
    title: '2048 Strategy Arena',
    description:
      '2048 策略进化竞技场：14 种 AI 策略同台竞技，Bitboard 位板引擎达到 74% 胜率；含 Boss 战斗动画、多策略参谋团、遗传算法调参与 ECharts 数据可视化。Python 后端 + 单页前端。',
    tags: ['Python', '算法', 'AI'],
    image: '2048-arena.webp',
    github: 'https://github.com/xrk-hhh/2048-Strategy-Arena',
    featured: true,
    over: 'ALGORITHM · AI',
    status: 'done',
  },
  {
    slug: 'starlight-site',
    title: 'Starlight 星港 · 本网站',
    description:
      '你正在逛的这座星港：Vue 3 + Three.js + GSAP 打造——GPU 粒子星海、奶龙/奶蛙桌宠、5 套主题换肤、贡献星图、算法星域与多页内容。从设计文档到任务拆解、实现、视觉验收、部署上线，全程由 deepseek-v4-pro + Claude Code 的 Agent 工作流驱动完成，开源可复建。',
    tags: ['Vue 3', 'TypeScript', 'Three.js', 'GSAP'],
    image: 'starlight-site.webp',
    github: 'https://github.com/xrk-hhh/starlight',
    demo: '/',
    featured: true,
    over: 'WEB · AGENT-DRIVEN',
    status: 'active',
  },
]
