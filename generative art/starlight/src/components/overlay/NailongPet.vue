<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

// 桌宠 v4（v1.9）：真·原版奶龙（erich207/nailong-codex-pet）与奶蛙（timerring/codex-pet-naiwa）
// 双角色精灵表动画——素材为 Codex v2 桌宠格式的透明背景帧，裁出 4 行并压缩：
// row0 idle(6帧) / row1 waving(4帧) / row2 jumping(5帧) / row3 running(6帧)。
// v2.15.1：帧动画由 CSS steps() 驱动（.pet-anim-* 类，见 style 块），不再有 JS 帧循环。
// 交互：拖拽 / 点击说话 / 双击跳跃 / ✕ 收起（sessionStorage）；hover 出现切换按钮选角色。
type Mood = 'idle' | 'poke' | 'dance' | 'drag'
type Char = 'nailong' | 'naiwa'

const CHAR_META: Record<Char, { name: string; sheet: string; lines: string[]; hi: string; feed: string[]; walk: string[] }> = {
  nailong: {
    name: '奶龙',
    sheet: `${import.meta.env.BASE_URL}images/nailong/pet-sheet.webp`,
    hi: '咩吼～ 奶龙前来报到 ✦',
    lines: [
      '咩吼～',
      '奶龙前来报到 ✦',
      '拖我去星港任何角落～',
      '哈哈哈（拍桌',
      '听说按 ? 有惊喜',
      '别戳啦，会掉毛的！',
      '正在探测附近的零食…',
      '星光今晚很亮呀',
      '你知道吗：0xor0=0，龙也懂异或',
      '哥德巴赫猜想还没人证明哦',
      '快排最坏 O(n²)，别迷信它',
    ],
    feed: ['嗷呜～零食好吃！', '吃饱了，巡航更有劲', '再来亿块（并没有', '咕噜咕噜～幸福'],
    walk: ['跟上了跟上了！', '散步巡航启动～', '别走太快呀喂！'],
  },
  naiwa: {
    name: '奶蛙',
    sheet: `${import.meta.env.BASE_URL}images/naiwa/pet-sheet.webp`,
    hi: '呱！奶蛙巡航中 ✦',
    lines: [
      '呱！',
      '奶蛙前来换班～',
      '蛙蛙目光坚定（并不',
      '今天的代码也要呱呱叫',
      '听说按 ? 有惊喜',
      '别戳啦，会跳走的！',
      '正在探测附近的蚊子…',
      '呱呱呱（摩斯密码',
      '青蛙一次能跳 1 阶或 2 阶——斐波那契！',
      '水塘计数？那就是 flood fill 呱',
    ],
    feed: ['呱！小虫干好吃！', '饱了饱了，呱～', '投喂记录 +1', '蚊子今天格外肥'],
    walk: ['呱呱跟上！', '蛙式散步，启动', '等等我呱！'],
  },
}

const DISPLAY_W = 140
// 源帧 119×129（按 0.62 缩放后的精灵表），显示高度按比例换算
const FRAME_H = Math.round((DISPLAY_W * 129) / 119)
// 视口窄于 1024（lg 以下）时不挂载：固定定位桌宠必然压住正文，且触屏拖拽会拦滚动
const PET_MIN_VIEWPORT = 1024

const char = ref<Char>('nailong')
const mood = ref<Mood>('idle')
const pos = ref({ x: 0, y: 0 })
const dragging = ref(false)
const bubble = ref('')
const hidden = ref(false)
// 性能（v1.10.2）：桌宠整体延迟到 idle 后挂载——不抢首屏渲染与带宽
// 性能（v2.15.1）：帧动画从 setInterval+Vue ref 改为 CSS steps() 合成器驱动——
// 空闲时零 JS/零响应式开销，页面切后台自动暂停；第二角色表空闲 4s 后预载，切换零延迟
const ready = ref(false)

const sheetUrl = computed(() => CHAR_META[char.value].sheet)
const sheetStyle = computed(() => ({
  // --fw/--fh 供帧动画 keyframes 计算帧偏移（与 JS 常量同源）
  '--fw': DISPLAY_W + 'px',
  '--fh': FRAME_H + 'px',
  width: DISPLAY_W + 'px',
  height: FRAME_H + 'px',
  backgroundImage: `url(${sheetUrl.value})`,
  backgroundSize: `${DISPLAY_W * 8}px ${FRAME_H * 4}px`,
}))

function speak(text?: string) {
  const meta = CHAR_META[char.value]
  bubble.value = text ?? meta.lines[Math.floor(Math.random() * meta.lines.length)]
  window.clearTimeout(bubbleTimer)
  bubbleTimer = window.setTimeout(() => (bubble.value = ''), 2600)
}
let bubbleTimer = 0
let moodTimer = 0

function setMood(m: Mood, backMs?: number) {
  window.clearTimeout(moodTimer)
  moodLockedUntil = backMs ? performance.now() + backMs : 0
  mood.value = m // 帧动画由 mood class 的 CSS steps() 驱动，换类即自动从头播放
  if (backMs) {
    moodTimer = window.setTimeout(() => setMood('idle'), backMs)
  }
}

// 角色切换（记忆选择；变身旋转一圈亮相——表已空闲预载，切换零白屏）
const morphSpin = ref(false)
let morphTimer = 0
function switchChar() {
  char.value = char.value === 'nailong' ? 'naiwa' : 'nailong'
  try {
    localStorage.setItem('starlight:pet-char', char.value)
  } catch {
    /* storage 不可用时静默 */
  }
  morphSpin.value = true
  window.clearTimeout(morphTimer)
  morphTimer = window.setTimeout(() => (morphSpin.value = false), 700)
  setMood('poke', 2200)
  speak(CHAR_META[char.value].hi)
}

/** 空闲预载另一角色的精灵表（~85KB，一次性的），首次切换时零延迟 */
function preloadOtherSheet() {
  const other = char.value === 'nailong' ? CHAR_META.naiwa.sheet : CHAR_META.nailong.sheet
  const img = new Image()
  img.decoding = 'async'
  img.src = other
}

function clampToViewport(x: number, y: number) {
  // 底部预留 36px：控制条移到脚下后，拖到屏幕底也要保证按钮可点
  return {
    x: Math.min(Math.max(8, x), window.innerWidth - DISPLAY_W - 8),
    y: Math.min(Math.max(8, y), window.innerHeight - FRAME_H - 36),
  }
}

let startX = 0
let startY = 0
let startPosX = 0
let startPosY = 0
let moved = 0

// ===== v2.8 新玩法 =====
// 惯性滑行：甩动释放后带速度滑行、摩擦减速、边缘反弹（经典桌宠手感）
// 散步模式：小跑跟随光标（toggle）；喂食：🍪 累计投喂存 localStorage；
// 时段问候：每次会话首次登场按本地时间问好
let vel = { x: 0, y: 0 }
let lastMoveAt = 0
let lastPetX: number | null = null
let lastPetY: number | null = null
let gliding = false
const walkMode = ref(false)
const walkPaused = ref(false) // v2.9：光标悬停在桌宠上时暂停散步——否则按钮永远点不到
const feedCount = ref(0)
let walkTarget: { x: number; y: number } | null = null
let animRaf = 0
let moodLockedUntil = 0
// v2.15.1 滑行倾斜：按水平速度前倾（身体语言表达「正在滑」），停止时经 transform
// transition 平滑回正；与拖拽 scale 互斥（拖拽中不滑，滑行中不拖）
const glideTilt = ref(0)

function onGlobalMouseMove(e: MouseEvent) {
  if (walkMode.value && !dragging.value) {
    walkTarget = { x: e.clientX - DISPLAY_W / 2, y: e.clientY - FRAME_H / 2 }
    // 循环可能已自行退出（此前无目标），有新目标时唤醒
    startAnimLoop()
  }
}

function startAnimLoop() {
  if (animRaf) return
  const step = () => {
    animRaf = 0
    const now = performance.now()
    if (dragging.value) return // 拖拽期间不跑物理
    let moving = false
    if (gliding) {
      pos.value = clampToViewport(pos.value.x + vel.x, pos.value.y + vel.y)
      // 边缘反弹：被夹紧的方向速度反转衰减
      if (pos.value.x <= 8 || pos.value.x >= window.innerWidth - DISPLAY_W - 8) vel.x *= -0.55
      if (pos.value.y <= 8 || pos.value.y >= window.innerHeight - FRAME_H - 8) vel.y *= -0.55
      vel.x *= 0.94
      vel.y *= 0.94
      // 滑行倾斜角：随水平速度前倾（限 ±16°），减速时自然回正
      glideTilt.value = Math.max(-16, Math.min(16, vel.x * 1.1))
      if (Math.hypot(vel.x, vel.y) < 0.15) {
        gliding = false
        vel = { x: 0, y: 0 }
        glideTilt.value = 0
      } else {
        moving = true
      }
    } else if (walkMode.value && walkTarget && !walkPaused.value) {
      const dx = walkTarget.x - pos.value.x
      const dy = walkTarget.y - pos.value.y
      const dist = Math.hypot(dx, dy)
      if (dist > 24) {
        const sp = Math.min(2.8, dist * 0.06)
        pos.value = clampToViewport(pos.value.x + (dx / dist) * sp, pos.value.y + (dy / dist) * sp)
        moving = true
      }
    }
    // 自动情绪：移动=奔跑行，静止=待机；不打断 poke/dance 等定时情绪
    if (now > moodLockedUntil) {
      const want: Mood = moving ? 'drag' : 'idle'
      mood.value = want
    }
    if (moving || gliding || (walkMode.value && walkTarget && !walkPaused.value)) animRaf = requestAnimationFrame(step)
    else if (walkMode.value) animRaf = requestAnimationFrame(step) // 散步暂停中也保持心跳，恢复即走
  }
  animRaf = requestAnimationFrame(step)
}

function toggleWalk() {
  walkMode.value = !walkMode.value
  if (walkMode.value) {
    setMood('drag')
    speak(CHAR_META[char.value].walk[Math.floor(Math.random() * CHAR_META[char.value].walk.length)])
    startAnimLoop()
  } else {
    walkTarget = null
    setMood('idle')
  }
}

// 投喂粒子（v2.9）：+1 / 心心 / 面包屑 上浮消散
const feedFx = ref<{ id: number; kind: string; dx: number }[]>([])
let fxId = 0
function spawnFeedFx() {
  const kinds = ['+1', '❤', '✦', '🍪']
  const items = Array.from({ length: 4 }, () => ({
    id: ++fxId,
    kind: kinds[Math.floor(Math.random() * kinds.length)],
    dx: Math.round((Math.random() - 0.5) * 90),
  }))
  feedFx.value.push(...items)
  window.setTimeout(() => {
    feedFx.value = feedFx.value.filter((f) => !items.some((i) => i.id === f.id))
  }, 1100)
}

// v2.15.1 投喂咀嚼：身体快速小幅左右摆 + squash（与帧动画/上浮粒子正交叠加）
const chewing = ref(false)
let chewTimer = 0
function feed() {
  feedCount.value += 1
  spawnFeedFx()
  try {
    localStorage.setItem('starlight:pet-fed', String(feedCount.value))
  } catch {
    /* storage 不可用时静默 */
  }
  chewing.value = true
  window.clearTimeout(chewTimer)
  chewTimer = window.setTimeout(() => (chewing.value = false), 1600)
  setMood('poke', 2200)
  const meta = CHAR_META[char.value]
  const line = feedCount.value % 4 === 0 ? `已投喂 ${feedCount.value} 次，好感度 ↑` : meta.feed[Math.floor(Math.random() * meta.feed.length)]
  speak(line)
}

function onPointerDown(e: PointerEvent) {
  dragging.value = true
  moved = 0
  vel = { x: 0, y: 0 }
  glideTilt.value = 0 // 抓起来瞬间回正
  lastPetX = e.clientX
  lastPetY = e.clientY
  lastMoveAt = performance.now()
  startX = e.clientX
  startY = e.clientY
  startPosX = pos.value.x
  startPosY = pos.value.y
  setMood('drag')
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  moved = Math.max(moved, Math.hypot(dx, dy))
  const now = performance.now()
  const dt = Math.max(1, now - lastMoveAt)
  // 速度估计（px/帧，按 16ms 折算）用位置差分而非 movementX——
  // movementX 在部分浏览器/合成事件下恒为 0；指数平滑抑制抖动
  const px = lastPetX
  const py = lastPetY
  if (px !== null && py !== null) {
    const nvx = ((e.clientX - px) / dt) * 16
    const nvy = ((e.clientY - py) / dt) * 16
    vel.x = vel.x * 0.7 + nvx * 0.3
    vel.y = vel.y * 0.7 + nvy * 0.3
  }
  lastPetX = e.clientX
  lastPetY = e.clientY
  lastMoveAt = now
  pos.value = clampToViewport(startPosX + dx, startPosY + dy)
}
function onPointerUp() {
  if (!dragging.value) return
  dragging.value = false
  const speed = Math.hypot(vel.x, vel.y)
  if (speed > 3.5 && moved >= 6) {
    // 甩出去：惯性滑行（限幅防飞出屏幕）
    const cap = 26
    const k = speed > cap ? cap / speed : 1
    vel = { x: vel.x * k, y: vel.y * k }
    gliding = true
    setMood('drag')
    startAnimLoop()
  } else if (!walkMode.value) {
    setMood('idle')
  }
}
// 点击检测挂 click（鼠标/触摸/合成事件都可靠），拖拽后的 click 用 moved 拦下
let lastPokeAt = 0
const pokeBounce = ref(false)
let bounceTimer = 0
function onClick() {
  const now = performance.now()
  if (now - lastPokeAt < 300) return
  lastPokeAt = now
  // 散步中点击 = 先停一停听你说话（不动 walkMode，仅暂停）
  if (walkMode.value) walkPaused.value = true
  pokeBounce.value = true
  window.clearTimeout(bounceTimer)
  bounceTimer = window.setTimeout(() => (pokeBounce.value = false), 520)
  setMood('poke', 2200)
  if (moved < 6) speak()
}
function onDblclick() {
  setMood('dance', 3200)
  speak(char.value === 'nailong' ? '奶龙出击！哈哈哈哈哈' : '呱！起飞！')
}
function hidePet() {
  hidden.value = true
  try {
    sessionStorage.setItem('starlight:nailong-hidden', '1')
  } catch {
    /* storage 不可用时静默 */
  }
}

function onResize() {
  pos.value = clampToViewport(pos.value.x, pos.value.y)
}

onMounted(() => {
  // idle 后再挂载桌宠（首屏渲染不加载精灵表、不启动帧循环）
  const schedule =
    'requestIdleCallback' in window
      ? (fn: () => void) => window.requestIdleCallback(fn, { timeout: 2500 })
      : (fn: () => void) => window.setTimeout(fn, 600)
  schedule(() => {
    if (hidden.value) return // 已被收起则不出现
    if (window.innerWidth < PET_MIN_VIEWPORT) return // 小屏不出场，避免遮挡正文
    try {
      const saved = localStorage.getItem('starlight:pet-char')
      if (saved === 'nailong' || saved === 'naiwa') char.value = saved
      hidden.value = sessionStorage.getItem('starlight:nailong-hidden') === '1'
    } catch {
      /* storage 不可用时静默 */
    }
    ready.value = true
    // 默认停泊左下：音乐按钮（bottom-6 left-6）上方留出一格——右下角会压住项目横移
    // 末卡的链接行（GitHub/在线参观），左侧偏上位置避开主要交互区
    pos.value = clampToViewport(24, window.innerHeight - FRAME_H - 112)
    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onGlobalMouseMove, { passive: true })
    // 帧动画已由 CSS steps() 驱动（挂载即播），无 JS 循环可启动；
    // 空闲 4s 后预载另一角色精灵表，首次切换零白屏
    window.setTimeout(preloadOtherSheet, 4000)
    // 时段问候（每次会话首次登场一次）
    try {
      if (!sessionStorage.getItem('starlight:pet-greeted')) {
        sessionStorage.setItem('starlight:pet-greeted', '1')
        const h = new Date().getHours()
        const greet =
          h < 5
            ? '夜这么深还在写代码呀…'
            : h < 11
              ? '早上好！今天也元气满满'
              : h < 14
                ? '午安～歇会儿眼睛吧'
                : h < 18
                  ? '下午好，航道畅通！'
                  : h < 23
                    ? '晚上好，今晚星光很亮'
                    : '夜深了，愿代码与你同眠'
        window.setTimeout(() => speak(greet), 700)
      }
      const fed = parseInt(localStorage.getItem('starlight:pet-fed') ?? '0', 10)
      if (Number.isFinite(fed) && fed > 0) feedCount.value = fed
    } catch {
      /* storage 不可用时静默 */
    }
  })
})
onUnmounted(() => {
  window.clearTimeout(bounceTimer)
  window.clearTimeout(morphTimer)
  window.clearTimeout(chewTimer)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('mousemove', onGlobalMouseMove)
  if (animRaf) cancelAnimationFrame(animRaf)
  window.clearTimeout(moodTimer)
  window.clearTimeout(bubbleTimer)
})
</script>

<template>
  <div
    v-if="ready && !hidden"
    class="group fixed z-[60]"
    :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
    @mouseenter="walkPaused = true"
    @mouseleave="walkPaused = false"
  >
    <!-- 气泡台词 -->
    <Transition name="bubble">
      <div
        v-if="bubble"
        class="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-primary/40 bg-bg/90 px-3 py-1 font-mono text-xs text-primary shadow-[0_0_16px_rgba(34,211,238,0.25)] backdrop-blur"
      >
        {{ bubble }}
      </div>
    </Transition>
    <!-- 控制条（v2.9 重设计）：图标圆钮一排居中悬于头顶；活跃功能带描边高亮 -->
    <div class="absolute -bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 opacity-0 transition-all duration-200 group-hover:opacity-100">
      <button
        type="button"
        tabindex="-1"
        :aria-label="`切换为${char === 'nailong' ? '奶蛙' : '奶龙'}`"
        :title="`切换为${char === 'nailong' ? '奶蛙' : '奶龙'}`"
        class="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-bg/90 text-xs backdrop-blur transition-all hover:scale-110 hover:border-primary/60"
        @pointerdown.stop
        @click.stop="switchChar"
      >
        {{ char === 'nailong' ? '🐸' : '🐉' }}
      </button>
      <button
        type="button"
        tabindex="-1"
        aria-label="投喂桌宠"
        :title="feedCount > 0 ? `投喂零食（已投喂 ${feedCount} 次）` : '投喂零食'"
        class="relative flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-bg/90 text-xs backdrop-blur transition-all hover:scale-110 hover:border-amber-300/60"
        @pointerdown.stop
        @click.stop="feed"
      >
        🍪
        <span v-if="feedCount > 0" class="absolute -right-1 -top-1 rounded-full bg-amber-400 px-1 font-mono text-[8px] leading-[13px] text-black/85">{{ feedCount > 99 ? '99+' : feedCount }}</span>
      </button>
      <button
        type="button"
        tabindex="-1"
        :aria-label="walkMode ? '停止散步' : '开始散步'"
        :title="walkMode ? '停止散步' : '散步跟随光标'"
        class="flex h-7 w-7 items-center justify-center rounded-full border text-xs backdrop-blur transition-all hover:scale-110"
        :class="walkMode ? 'border-emerald-400/70 bg-emerald-400/15 shadow-[0_0_10px_rgba(52,211,153,0.35)]' : 'border-white/15 bg-bg/90 hover:border-emerald-300/60'"
        @pointerdown.stop
        @click.stop="toggleWalk"
      >
        {{ walkMode ? '🛑' : '🚶' }}
      </button>
      <button
        type="button"
        tabindex="-1"
        aria-label="收起桌宠"
        title="收起桌宠"
        class="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-bg/90 text-[10px] text-text-muted backdrop-blur transition-all hover:scale-110 hover:text-text"
        @pointerdown.stop
        @click.stop="hidePet"
      >
        ✕
      </button>
    </div>

    <!-- 投喂粒子：上浮消散 -->
    <span
      v-for="f in feedFx"
      :key="f.id"
      aria-hidden="true"
      class="feed-fx pointer-events-none absolute left-1/2 top-2 z-20 font-mono text-xs text-amber-300"
      :style="{ '--fx-dx': f.dx + 'px' }"
    >
      {{ f.kind }}
    </span>

    <!-- 精灵表动画（v2.15.1 重构）：帧循环由 CSS steps() 合成器驱动（mood 类），
         行为动画全部与帧动画正交叠加：
         · walk-bob   散步颠簸（小跑起伏）
         · chew       投喂咀嚼（快速左右摆）
         · morph-spin 切换变身（旋转一圈亮相）
         · glideTilt  惯性滑行前倾（inline transform，随速度）
         交互事件挂稳定容器（换 mood 不换元素，事件不丢）；静止时降透明度让路给正文。
         注意只过渡 transform/opacity——精灵表帧动画靠 background-position 步进 -->
    <div
      class="cursor-grab touch-none select-none drop-shadow-[0_10px_16px_rgba(0,0,0,0.4)] transition-[transform,opacity] duration-200 active:cursor-grabbing group-hover:opacity-100"
      :class="[
        `pet-anim-${mood}`,
        dragging || bubble ? 'opacity-100' : 'opacity-60',
        { 'scale-110': dragging, 'poke-bounce': pokeBounce },
        { 'walk-bob': walkMode && !walkPaused && !dragging },
        { chew: chewing },
        { 'morph-spin': morphSpin },
      ]"
      :style="{ ...sheetStyle, transform: glideTilt ? `rotate(${glideTilt}deg)` : undefined }"
      role="img"
      :aria-label="`桌宠${CHAR_META[char].name}，可以拖拽玩耍`"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @mouseup="onPointerUp"
      @click="onClick"
      @dblclick="onDblclick"
    ></div>

    <!-- 停泊光晕：脚下的星光 -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -bottom-2 left-1/2 h-2.5 w-16 -translate-x-1/2 rounded-full bg-primary/25 blur-md transition-opacity duration-300 group-hover:bg-primary/40"
    ></div>
  </div>
</template>

<style scoped>
/* ===== v2.15.1 帧动画：CSS steps() 合成器驱动（替代 setInterval+Vue ref） =====
   每行一张情绪（row0 idle 6帧 / row1 poke 4帧 / row2 dance 5帧 / row3 drag 6帧），
   110ms/帧 → 时长 = 帧数 × 0.11s；steps(N) 精确跳帧不做插值。
   收益：空闲零 JS/零响应式开销，页面切后台浏览器自动暂停动画与计时。 */
.pet-anim-idle {
  animation: pet-row0 0.66s steps(6) infinite;
}
.pet-anim-poke {
  animation: pet-row1 0.44s steps(4) infinite;
}
.pet-anim-dance {
  animation: pet-row2 0.55s steps(5) infinite;
}
.pet-anim-drag {
  animation: pet-row3 0.66s steps(6) infinite;
}
@keyframes pet-row0 {
  from { background-position: 0 calc(var(--fh) * 0); }
  to { background-position: calc(var(--fw) * -6) calc(var(--fh) * 0); }
}
@keyframes pet-row1 {
  from { background-position: 0 calc(var(--fh) * 1); }
  to { background-position: calc(var(--fw) * -4) calc(var(--fh) * 1); }
}
@keyframes pet-row2 {
  from { background-position: 0 calc(var(--fh) * 2); }
  to { background-position: calc(var(--fw) * -5) calc(var(--fh) * 2); }
}
@keyframes pet-row3 {
  from { background-position: 0 calc(var(--fh) * 3); }
  to { background-position: calc(var(--fw) * -6) calc(var(--fh) * 3); }
}

/* ===== 行为动画（与帧动画正交：transform 系） ===== */
/* 散步颠簸：小跑的上下起伏 + 微倾 */
.walk-bob {
  animation: walk-bob 0.42s ease-in-out infinite alternate;
}
@keyframes walk-bob {
  from { transform: translateY(0) rotate(-2deg); }
  to { transform: translateY(-5px) rotate(2deg); }
}
/* 投喂咀嚼：快速左右摆 + 轻微 squash */
.chew {
  animation: chew 0.16s ease-in-out infinite alternate;
}
@keyframes chew {
  from { transform: rotate(-4deg) scale(1.04, 0.96); }
  to { transform: rotate(4deg) scale(0.97, 1.03); }
}
/* 切换变身：旋转一圈 + 缩放亮相 */
.morph-spin {
  animation: morph-spin 0.65s cubic-bezier(0.34, 1.2, 0.64, 1);
}
@keyframes morph-spin {
  0% { transform: rotate(0deg) scale(1); }
  45% { transform: rotate(200deg) scale(0.55); }
  100% { transform: rotate(360deg) scale(1); }
}
/* 点击 Q 弹（v2.9）：与帧动画（background-position）正交，transform 独立作用 */
.poke-bounce {
  animation: poke-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes poke-bounce {
  0% { transform: scale(1, 1); }
  35% { transform: scale(1.15, 0.85) translateY(6%); }
  70% { transform: scale(0.94, 1.08) translateY(-4%); }
  100% { transform: scale(1, 1); }
}
/* 投喂粒子：错峰上浮 + 轻微旋转 */
.feed-fx {
  animation: feed-fx 1.05s ease-out forwards;
}
@keyframes feed-fx {
  0% { opacity: 0; transform: translate(-50%, 0) scale(0.6); }
  18% { opacity: 1; }
  100% { opacity: 0; transform: translate(calc(-50% + var(--fx-dx, 0px)), -64px) scale(1.1) rotate(8deg); }
}
@media (prefers-reduced-motion: reduce) {
  /* 帧动画静止在各情绪首帧；行为动画全部关闭（滑行倾角由 JS 常零值关闭） */
  .pet-anim-idle { animation: none; background-position: 0 calc(var(--fh) * 0); }
  .pet-anim-poke { animation: none; background-position: 0 calc(var(--fh) * 1); }
  .pet-anim-dance { animation: none; background-position: 0 calc(var(--fh) * 2); }
  .pet-anim-drag { animation: none; background-position: 0 calc(var(--fh) * 3); }
  .poke-bounce,
  .feed-fx,
  .walk-bob,
  .chew,
  .morph-spin {
    animation: none;
  }
}

.bubble-enter-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.bubble-leave-active {
  transition: opacity 0.25s ease;
}
.bubble-enter-from {
  opacity: 0;
  transform: translate(-50%, 6px) scale(0.8);
}
.bubble-leave-to {
  opacity: 0;
}
</style>
