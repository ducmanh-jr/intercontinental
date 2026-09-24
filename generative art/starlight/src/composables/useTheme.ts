import { ref } from 'vue'

// 多主题系统（v1.9 起步，v2.11 场景化）：不止换 6 个 CSS 变量——
// 每个主题携带独立的「场景色板」（粒子双色 / 暖星 / 流星）与氛围层（main.css），
// 切主题 = 星空本身换色 + 背景氛围层重构，而非仅字色滤镜。
// 主题在 index.html 首帧前由内联脚本应用到 <html data-theme>（防闪色），
// 这里负责运行时切换、持久化与 theme-color 同步。
export interface ThemeScene {
  /** 粒子主色 A（约 50% 粒子 + 星云 tint 交替） */
  colorA: string
  /** 粒子主色 B */
  colorB: string
  /** 暖星点缀色（5% 粒子） */
  warm: string
  /** 流星颜色 */
  meteor: string
}

export interface ThemeDef {
  key: string
  label: string
  hint: string
  swatch: { bg: string; primary: string; accent: string }
  /** 星空场景色板（ParticleScene.setTheme 消费） */
  scene: ThemeScene
  /** 浅色主题：粒子/星云/流星切换 NormalBlending（加色混合在浅底上不可见） */
  light: boolean
  /** giscus 评论区主题 */
  giscus: string
}

export const THEMES: ThemeDef[] = [
  {
    key: 'starport',
    label: '深空星港',
    hint: '青紫星海 · 默认',
    swatch: { bg: '#0a0a12', primary: '#22d3ee', accent: '#8b5cf6' },
    scene: { colorA: '#22d3ee', colorB: '#8b5cf6', warm: '#fbbf24', meteor: '#8c9bff' },
    light: false,
    giscus: 'dark',
  },
  {
    key: 'sunset',
    label: '落日熔金',
    hint: '琥珀 × 玫瑰的暖晚霞',
    swatch: { bg: '#120c0a', primary: '#f59e0b', accent: '#f43f5e' },
    scene: { colorA: '#f59e0b', colorB: '#f43f5e', warm: '#fde68a', meteor: '#fb923c' },
    light: false,
    giscus: 'dark',
  },
  {
    key: 'aurora',
    label: '极光冰川',
    hint: '极地夜空的青绿极光',
    swatch: { bg: '#071016', primary: '#2dd4bf', accent: '#60a5fa' },
    scene: { colorA: '#2dd4bf', colorB: '#60a5fa', warm: '#a7f3d0', meteor: '#7dd3fc' },
    light: false,
    giscus: 'dark',
  },
  {
    key: 'paper',
    label: '月白纸笺',
    hint: '暖纸底色 · 浅色',
    swatch: { bg: '#f5f2ea', primary: '#0f766e', accent: '#7c3aed' },
    scene: { colorA: '#0f766e', colorB: '#7c3aed', warm: '#d97706', meteor: '#5eead4' },
    light: true,
    giscus: 'light',
  },
  {
    key: 'sakura',
    label: '樱庭薄暮',
    hint: '樱粉薄暮 · 浅色',
    swatch: { bg: '#fbf4f7', primary: '#be185d', accent: '#6d28d9' },
    scene: { colorA: '#be185d', colorB: '#6d28d9', warm: '#f472b6', meteor: '#f9a8d4' },
    light: true,
    giscus: 'light',
  },
]

const STORAGE_KEY = 'starlight:theme'
const current = ref<string>(
  typeof document !== 'undefined' ? document.documentElement.dataset.theme || 'starport' : 'starport',
)

export function themeDef(key: string): ThemeDef {
  return THEMES.find((t) => t.key === key) ?? THEMES[0]
}

function applyTheme(key: string) {
  const def = themeDef(key)
  current.value = def.key
  document.documentElement.dataset.theme = def.key
  // 同步浏览器 UI 色（地址栏/状态栏）
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', def.swatch.bg)
  try {
    localStorage.setItem(STORAGE_KEY, def.key)
  } catch {
    /* storage 不可用时静默 */
  }
}

export function useTheme() {
  return { themes: THEMES, current, applyTheme }
}
