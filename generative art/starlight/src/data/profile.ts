import { SITE_VERSION } from './site'
export interface Skill {
  name: string
  level: '熟练' | '了解'
}

export interface SocialLink {
  label: string
  url: string
}

export interface QuickFact {
  label: string
  value: string
}

export interface TimelineItem {
  date: string
  title: string
  desc: string
}

export interface NowItem {
  doing: string[]
  reading: string[]
  learning: string[]
  next: string[]
}

export const profile = {
  name: 'xrk-hhh',
  title: '全栈开发 / 算法爱好者',
  motto: '把想法变成能跑的东西 ✦',
  introShort: '算法爱好者 · 独立开发者。把想法变成能跑的东西——游戏、AI 工具、Web 星港。',
  typedPhrases: ['写代码', '刷算法', '折腾前端', '做点有意思的东西'],
  introLong:
    '我是 xrk-hhh，计算机专业的学生开发者。算法竞赛爱好者——蓝桥杯 C++ B 组国二是目前的最好成绩，日常在洛谷（488 通过）和牛客竞赛（Rating 1635）刷题保持手感。\n\n' +
    '开发上大量使用 AI Agent：主力 deepseek-v4-pro + Claude Code，最近在研究 deepseek harness + deepseek-v4-flash 的轻量组合，「规划-执行-审查」自动循环——这座星港就是它的产物。',
  avatar: `${import.meta.env.BASE_URL}images/avatar.webp`,
  skills: [
    { name: 'Java', level: '熟练' },
    { name: 'Python', level: '熟练' },
    { name: 'Vue 3', level: '熟练' },
    { name: 'TypeScript', level: '熟练' },
    { name: 'C++', level: '熟练' },
    { name: '算法与数据结构', level: '熟练' },
    { name: 'AI Agent 工作流', level: '熟练' },
    { name: 'Three.js', level: '了解' },
    { name: 'Tailwind CSS', level: '了解' },
    { name: '数学建模', level: '了解' },
  ] as Skill[],
  timeline: [
    { date: '2026-06', title: '蓝桥杯 C++ B 组 · 国二', desc: '目前最好的算法竞赛成绩；对 ACM-XCPC 类竞赛保持兴趣，日常在洛谷/牛客刷题。' },
    { date: '2026-06', title: 'Galaxy Defender', desc: '第一个完整游戏项目：Java Swing 纵版射击 + Roguelike 升级。' },
    { date: '2026-06', title: 'Art Style Transfer', desc: 'PySide6 + OpenCV 桌面应用，六种艺术风格滤镜，云端/离线双引擎。' },
    { date: '2026-07', title: '2048 Strategy Arena', desc: '14 种 AI 策略同台竞技，Bitboard 引擎 74% 胜率。' },
    { date: '2026-08', title: '星港上线', desc: 'Vue 3 + Three.js + GSAP 搭建，AI Agent 驱动开发，GitHub Pages 自动部署——持续迭代至今。' },
    { date: '现在', title: '星港巡航中', desc: `本站迭代至 ${SITE_VERSION} · 备战数模（高教社）与数竞（CMC）· deepseek harness 研究 · 洛谷/牛客保持手感。` },
  ] as TimelineItem[],
  socials: [
    { label: 'GitHub', url: 'https://github.com/xrk-hhh' },
    { label: '邮箱', url: 'mailto:xxjh2487657826@outlook.com' },
  ] as SocialLink[],
  quickFacts: [
    { label: 'TECH', value: 'Vue · TS · Three.js · Python · Java' },
    { label: 'FOCUS', value: '算法 · 数模 · AI Agent' },
    { label: 'NOW', value: '数模 · 数竞赛备战中' },
    { label: 'UPDATED', value: '2026-08' },
  ] as QuickFact[],
  // /now 星港日志（v1.8）：改这里即可更新「现在」页
  now: {
    doing: [
      '备战数模（高教社杯）：真题模拟 + LaTeX 排版训练',
      '备战数竞（CMC 非数学 A）：微积分/线代/概统重难点轮刷',
      'deepseek harness × deepseek-v4-flash：插件性能调优与循环编排',
      '星港迭代（当前 ' + SITE_VERSION + '）：知识库 31 篇题解 + 五主题 + 桌宠 v5',
    ],
    reading: ['数学建模算法与应用（司守奎）', 'Vue 3 官方文档·响应式原理', '《算法竞赛》罗勇军（选读）'],
    learning: ['数模新方向：机器学习建模与智能优化算法', '用 agent 辅助数模研究（选题/建模/求解流水线）', 'deepseek harness 插件体系：专注其对性能提升的研究', 'CMC 真题套路：构造性证明与计算技巧'],
    next: ['高教社数模国赛', 'CMC 决赛', '牛客周赛继续打', '数论·组合数学复盘系列'],
  } as NowItem,
} satisfies {
  name: string
  title: string
  motto: string
  introShort: string
  typedPhrases: string[]
  introLong: string
  avatar: string
  skills: Skill[]
  timeline: TimelineItem[]
  socials: SocialLink[]
  quickFacts: QuickFact[]
  now: NowItem
}
