<script setup lang="ts">
import { computed, ref } from 'vue'

// 技能星云 v2（v2.8）：雷达图精修——刻度环渐次绘入、星云弹性舒展、
// 顶点四芒星闪烁、外圈星座装饰环慢旋；hover 轴标签高亮对应轴与顶点。
// 纯 SVG + CSS 动画，无依赖；reduced-motion 直出终态。
interface NebulaAxis {
  label: string
  value: number // 0-100
}

const props = defineProps<{ axes: NebulaAxis[] }>()

const CX = 230
const CY = 172
const R = 100
const N = computed(() => props.axes.length || 1)

function pointAt(i: number, r: number) {
  const angle = (Math.PI * 2 * i) / N.value - Math.PI / 2
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) }
}
const ringAt = (f: number) =>
  props.axes.map((_, i) => pointAt(i, R * f)).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
const RINGS = [0.25, 0.5, 0.75, 1]
const SCALES = ['25', '50', '75', '100']

const dataPoints = computed(() =>
  props.axes.map((a, i) => pointAt(i, (R * Math.min(100, Math.max(0, a.value))) / 100)),
)
const dataPolygon = computed(() => dataPoints.value.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '))

// 顶点四芒星路径（以 0,0 为中心，臂长 8）
const STAR_PATH = 'M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z'

// 轴标签（外扩 30px）
const labels = computed(() =>
  props.axes.map((a, i) => {
    const p = pointAt(i, R + 32)
    return {
      ...p,
      label: a.label,
      value: a.value,
      anchor: Math.abs(p.x - CX) < 14 ? 'middle' : p.x > CX ? 'start' : 'end',
      i,
    }
  }),
)

const hovered = ref<number | null>(null)
</script>

<template>
  <div data-reveal class="card relative overflow-hidden p-5">
    <!-- 背景点缀星尘 -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0">
      <span class="stardust left-[12%] top-[18%]"></span>
      <span class="stardust left-[84%] top-[12%]" style="animation-delay: 1.2s"></span>
      <span class="stardust left-[76%] top-[78%]" style="animation-delay: 0.6s"></span>
      <span class="stardust left-[18%] top-[82%]" style="animation-delay: 1.8s"></span>
      <span class="stardust left-[50%] top-[8%]" style="animation-delay: 2.4s"></span>
    </div>

    <svg viewBox="0 0 460 344" class="relative mx-auto w-full max-w-[420px]" role="img" aria-label="技能星云雷达图">
      <defs>
        <linearGradient id="nebulaFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style="stop-color: var(--color-primary)" stop-opacity="0.30" />
          <stop offset="1" style="stop-color: var(--color-accent)" stop-opacity="0.30" />
        </linearGradient>
        <linearGradient id="nebulaStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style="stop-color: var(--color-primary)" />
          <stop offset="1" style="stop-color: var(--color-accent)" />
        </linearGradient>
        <filter id="vertexGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.6" flood-color="var(--color-accent)" flood-opacity="0.9" />
        </filter>
      </defs>

      <!-- 外圈星座装饰环：慢旋虚线 + 四颗方位星 -->
      <g class="deco-ring">
        <circle :cx="CX" :cy="CY" :r="R + 18" fill="none" class="deco-ring-line" stroke-width="1" stroke-dasharray="2 7" />
        <circle v-for="k in 4" :key="k" :cx="CX + (R + 18) * Math.cos(Math.PI / 4 + (Math.PI / 2) * (k - 1))" :cy="CY - (R + 18) * Math.sin(Math.PI / 4 + (Math.PI / 2) * (k - 1))" r="1.8" style="fill: var(--color-primary)" opacity="0.7" />
      </g>

      <!-- 刻度环：渐次绘入 + 顶轴刻度数字 -->
      <polygon
        v-for="(f, i) in RINGS"
        :key="f"
        :points="ringAt(f)"
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        stroke-width="1"
        class="ring-draw"
        :style="{ animationDelay: i * 0.12 + 's' }"
      />
      <text v-for="(f, i) in RINGS" :key="'s' + f" :x="CX + 3" :y="CY - R * f - 2" class="fill-text-muted/40 font-mono" font-size="8">{{ SCALES[i] }}</text>

      <!-- 轴线（hover 高亮） -->
      <line
        v-for="(a, i) in axes"
        :key="a.label"
        :x1="CX" :y1="CY"
        :x2="pointAt(i, R).x" :y2="pointAt(i, R).y"
        :stroke="hovered === i ? 'rgba(34,211,238,0.45)' : 'rgba(255,255,255,0.07)'"
        stroke-width="1"
        class="transition-all duration-300"
      />

      <!-- 星云主体 -->
      <g class="nebula-body">
        <polygon :points="dataPolygon" fill="url(#nebulaFill)" stroke="url(#nebulaStroke)" stroke-width="1.6" stroke-linejoin="round" />
        <path
          v-for="(p, i) in dataPoints"
          :key="'v' + i"
          :d="STAR_PATH"
          :transform="`translate(${p.x} ${p.y}) scale(${hovered === i ? 1.5 : 1})`"
          fill="#c4b5fd"
          filter="url(#vertexGlow)"
          class="vertex-star transition-transform duration-300"
          :style="{ animationDelay: i * 0.4 + 's' }"
        />
      </g>

      <!-- 轴标签 + 数值（hover 联动） -->
      <g v-for="l in labels" :key="'l' + l.label" @mouseenter="hovered = l.i" @mouseleave="hovered = null">
        <text :x="l.x" :y="l.y" :text-anchor="l.anchor" class="fill-text-muted font-mono transition-all duration-200" :font-size="hovered === l.i ? 12 : 11" :font-weight="hovered === l.i ? 600 : 400">{{ l.label }}</text>
        <text :x="l.x" :y="l.y + 14" :text-anchor="l.anchor" class="font-mono transition-opacity duration-200" :fill="hovered === l.i ? 'var(--color-primary)' : 'rgba(156,163,175,0.55)'" font-size="10" :opacity="hovered === l.i ? 1 : 0.75">{{ l.value }}</text>
      </g>
    </svg>
    <p class="relative mt-1 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/50">Skill Nebula · 技能星云</p>
  </div>
</template>

<style scoped>
.stardust {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(196, 181, 253, 0.5);
  animation: stardust-blink 3.2s ease-in-out infinite;
}
@keyframes stardust-blink {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.9; }
}

.deco-ring {
  transform-box: fill-box;
  transform-origin: center;
  animation: deco-rotate 120s linear infinite;
}
/* v2.16 装饰环虚线：主题 accent 淡描（原硬编码紫） */
.deco-ring-line {
  stroke: color-mix(in oklab, var(--color-accent) 18%, transparent);
}
@keyframes deco-rotate {
  to { transform: rotate(360deg); }
}

.ring-draw {
  stroke-dasharray: 900;
  stroke-dashoffset: 900;
  animation: ring-in 1s ease-out forwards;
}
@keyframes ring-in {
  to { stroke-dashoffset: 0; }
}

.nebula-body {
  transform-box: fill-box;
  transform-origin: center;
  animation: nebula-in 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) 0.35s both;
}
@keyframes nebula-in {
  from { transform: scale(0.55); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.vertex-star {
  animation: vertex-pulse 2.8s ease-in-out infinite;
}
@keyframes vertex-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.65; }
}

@media (prefers-reduced-motion: reduce) {
  .stardust,
  .deco-ring,
  .vertex-star,
  .nebula-body,
  .ring-draw {
    animation: none;
  }
  .ring-draw {
    stroke-dashoffset: 0;
  }
}
</style>
