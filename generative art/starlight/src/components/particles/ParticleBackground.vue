<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { particlesState } from '@/stores/particles'
import { profile } from '@/data/profile'
import { useTheme, themeDef } from '@/composables/useTheme'

// three.js 不进首屏主包：动态导入 + requestIdleCallback 延迟初始化，
// 让首屏渲染与 Vue 挂载优先完成（粒子是装饰层，晚 1s 出现无感知）。
type ParticleSceneCtor = typeof import('@/three/ParticleScene').ParticleScene

const router = useRouter()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let scene: InstanceType<ParticleSceneCtor> | null = null
let mediaMobile: MediaQueryList | null = null
let mediaReduced: MediaQueryList | null = null
let coarse = false // 触屏设备：主星渲染但不交互
let hoverIdx: number | null = null
let labelRaf = 0
let lastMeteorBurst = 0

const hoveredLabel = ref<string | null>(null)
const labelX = ref(0)
const labelY = ref(0)

// 主星导航路由：GitHub/邮箱从 profile.socials 推导，避免硬编码
const navRoutes = computed(() => {
  const email = profile.socials.find((s) => s.label === '邮箱')?.url
  const githubUrl = profile.socials.find((s) => s.label === 'GitHub')?.url ?? 'https://github.com/'
  return [
    { label: '首页', to: '/' },
    { label: '关于', to: '/about' },
    { label: '项目', to: '/projects' },
    { label: '博客', to: '/blog' },
    { label: 'GitHub', to: githubUrl },
    { label: '邮箱', to: email ?? 'mailto:xxjh2487657826@outlook.com' },
  ]
})

// 监听回调必须与移除时引用一致，故定义为组件作用域具名函数
const applyMobile = () => {
  scene?.setMobile(mediaMobile?.matches ?? false)
  if (mediaMobile?.matches) {
    clearHover()
    scene?.clearRepelPoint()
  }
}
const applyReduced = () => {
  scene?.setReducedMotion(mediaReduced?.matches ?? false)
  if (mediaReduced?.matches) {
    clearHover()
    scene?.clearRepelPoint()
  }
}

// 指针离开窗口/失焦时清除排斥场，避免指针停在原地不动时星空持续凹陷
const clearRepel = () => scene?.clearRepelPoint()

function clearHover() {
  hoverIdx = null
  scene?.setNavStarHover(null)
  hoveredLabel.value = null
  stopLabelTrack()
}

function startLabelTrack() {
  if (labelRaf) cancelAnimationFrame(labelRaf)
  labelRaf = requestAnimationFrame(trackLabel)
}

function stopLabelTrack() {
  if (labelRaf) cancelAnimationFrame(labelRaf)
  labelRaf = 0
}

// label 位置写入（left 以星为中心偏移 -40 并 clamp 在视口内，避免溢出）
function applyLabelPos(pos: { x: number; y: number }) {
  labelX.value = Math.min(Math.max(pos.x - 40, 8), window.innerWidth - 96)
  labelY.value = pos.y
}

// hover 期间让 label 跟随主星（主星有漂移 + 视差，需逐帧定位）
function trackLabel() {
  if (hoverIdx !== null && scene) {
    const pos = scene.navStarScreenPositions()[hoverIdx]
    if (pos) applyLabelPos(pos)
    labelRaf = requestAnimationFrame(trackLabel)
  }
}

function onPointerMove(e: PointerEvent) {
  scene?.setParallaxTarget(
    e.clientX / window.innerWidth - 0.5,
    e.clientY / window.innerHeight - 0.5,
  )
  // 主星 hover：coarse（触屏）/ reduced-motion 下跳过
  if (!scene || coarse || (mediaReduced?.matches ?? false)) return
  // 鼠标排斥场（同样仅非 coarse / 非 reduced-motion 时生效）
  scene.setRepelPoint(e.clientX, e.clientY)
  const idx = scene.pickNavStar(e.clientX, e.clientY)
  if (idx === hoverIdx) return
  hoverIdx = idx
  scene.setNavStarHover(idx)
  hoveredLabel.value = idx === null ? null : (navRoutes.value[idx]?.label ?? null)
  if (idx !== null) {
    const pos = scene.navStarScreenPositions()[idx]
    if (pos) applyLabelPos(pos)
    startLabelTrack()
  } else {
    stopLabelTrack()
  }
}

// canvas 保持 pointer-events-none，点击用 window 级监听；
// 先跳过交互元素（按钮/链接等）避免双触发，再重校验命中（pickNavStar），
// 只有真点在主星上才消费，避免与页面元素点击冲突
function onClick(e: MouseEvent) {
  if (!scene || coarse || (mediaReduced?.matches ?? false)) return
  const t = e.target as Element | null
  if (t?.closest?.('a,button,input,select,textarea,[role="button"]')) return
  const idx = scene.pickNavStar(e.clientX, e.clientY)
  if (idx === null) return
  const target = navRoutes.value[idx]?.to
  if (!target) return
  if (target.startsWith('http') || target.startsWith('mailto:')) {
    window.open(target, '_blank', 'noopener')
  } else {
    void router.push(target)
  }
}

// v1.4 打字即流星：单字符键让流星从头划过；120ms 限速；
// 仅桌面非 coarse、非 reduced-motion 且密度非 off 时触发。
// 不 preventDefault，输入框内打字同样触发且不拦截输入。
function onKeydown(e: KeyboardEvent) {
  if (e.key.length !== 1) return // 组合键/功能键（Enter/Backspace/方向键等）忽略
  if (e.ctrlKey || e.metaKey || e.altKey) return // 修饰键组合忽略（Shift 不算：Shift+字母仍是打字）
  if (coarse || (mediaReduced?.matches ?? false)) return
  if (particlesState.density === 'off') return
  const now = performance.now()
  if (now - lastMeteorBurst < 120) return
  lastMeteorBurst = now
  scene?.burstMeteor()
}

// v2.12 彩蛋入口：其他组件（联络信使发送成功等）广播 starlight:meteor 即划流星
function onMeteorEvent() {
  if (coarse || (mediaReduced?.matches ?? false)) return
  scene?.burstMeteor()
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  // 延迟初始化：idle 后再加载 three 分包并建场景（不抢首屏主线程）
  const schedule =
    'requestIdleCallback' in window
      ? (fn: () => void) => window.requestIdleCallback(fn, { timeout: 2000 })
      : (fn: () => void) => window.setTimeout(fn, 300)
  schedule(() => {
    if (!canvasRef.value) return // 组件已卸载
    void (async () => {
      try {
        const mod = await import('@/three/ParticleScene')
        if (!canvasRef.value) return // await 期间组件卸载
        scene = new mod.ParticleScene(canvasRef.value)
        const scenePalette = themeDef(current.value).scene
        scene.init({
          count: 1000,
          colorA: scenePalette.colorA,
          colorB: scenePalette.colorB,
          navStars: navRoutes.value.length,
        })
        // 暖星/流星色不在 init 参数里，初始化后补一次全量场景色
        scene.setTheme(scenePalette.colorA, scenePalette.colorB, scenePalette.warm, scenePalette.meteor)
      } catch (err) {
        // WebGL 不可用（§5.3）：隐藏 canvas，回退 main.css 里的 CSS 渐变背景
        console.warn('[particles] WebGL 初始化失败，回退静态背景', err)
        const el = canvasRef.value
        if (el) el.style.display = 'none'
        return
      }
      scene!.setDensity(particlesState.density) // 补上初始密度（watch 无 immediate）
      mediaMobile = window.matchMedia('(max-width: 767px)')
      mediaReduced = window.matchMedia('(prefers-reduced-motion: reduce)')
      coarse = window.matchMedia('(pointer: coarse)').matches
      mediaMobile.addEventListener('change', applyMobile)
      mediaReduced.addEventListener('change', applyReduced)
      applyMobile()
      applyReduced()
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      window.addEventListener('click', onClick)
      window.addEventListener('keydown', onKeydown, { passive: true })
      window.addEventListener('starlight:meteor', onMeteorEvent)
      window.addEventListener('blur', clearRepel)
      document.documentElement.addEventListener('mouseleave', clearRepel)
    })()
  })
})

watch(
  () => particlesState.density,
  (d) => {
    scene?.setDensity(d)
    // 密度 off（如博客文章页）主星隐藏：清掉悬停状态，避免 label 滞留
    if (d === 'off') clearHover()
  },
)

// v2.11 主题场景化：切主题时星空实时换色（粒子仍在运行，无需重建场景）
const { current } = useTheme()
watch(current, (key) => {
  const p = themeDef(key).scene
  scene?.setTheme(p.colorA, p.colorB, p.warm, p.meteor)
})

onUnmounted(() => {
  stopLabelTrack()
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('click', onClick)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('starlight:meteor', onMeteorEvent)
  window.removeEventListener('blur', clearRepel)
  document.documentElement.removeEventListener('mouseleave', clearRepel)
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
  <Transition name="fade">
    <span
      v-if="hoveredLabel"
      aria-hidden="true"
      class="pointer-events-none fixed z-30 rounded-full border border-primary/40 bg-bg/90 px-3 py-1 font-mono text-xs text-text"
      :style="{ left: labelX + 'px', top: labelY - 34 + 'px' }"
    >
      {{ hoveredLabel }}
    </span>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
