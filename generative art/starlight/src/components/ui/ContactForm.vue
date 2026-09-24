<script setup lang="ts">
import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import { profile } from '@/data/profile'

// 联络信使（v2.11）：姓名/邮箱/主题/消息四字段电报，双通道投递——
// 1) 配置了 VITE_WEB3FORMS_ACCESS_KEY（.env，https://web3forms.com 免费注册）→ 表单直投站长邮箱
// 2) 未配置 → 降级 mailto：把四字段拼成预填邮件，唤起访客邮件客户端（零配置零依赖）
// 草稿自动存 localStorage（key 下），发送成功后清空；honeypot 字段对机器人可见对用户不可见。
const email = (profile.socials.find((s) => s.label === '邮箱')?.url ?? '').replace(/^mailto:/, '')
const WEB3FORMS_KEY = (import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as string | undefined) ?? ''

const DRAFT_KEY = 'starlight:contact-draft'

const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
  botcheck: '', // honeypot：真实用户永远不填
})

// 恢复上次未发送完的草稿
try {
  const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null') as typeof form | null
  if (saved && typeof saved.name === 'string') Object.assign(form, saved)
} catch {
  /* storage 不可用或内容损坏时静默 */
}

const status = ref<'idle' | 'sending' | 'sent' | 'mailto'>('idle')
const statusMsg = ref('')
const errors = reactive({ name: '', email: '', subject: '', message: '' })

watch(
  () => ({ ...form }),
  (f) => {
    if (status.value === 'sent') return // 成功后不再覆写
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(f))
    } catch {
      /* storage 不可用时静默 */
    }
    // 输入时即时清除已解决的错误（只清不增，避免边打字边被提示）
    if (f.name.trim()) errors.name = ''
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errors.email = ''
    if (f.subject.trim()) errors.subject = ''
    if (f.message.trim()) errors.message = ''
  },
  { deep: true },
)

function validate(): boolean {
  errors.name = form.name.trim() ? '' : '留下你的名字或代号'
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? '' : '邮箱格式好像不对，回信要靠它'
  errors.subject = form.subject.trim() ? '' : '给这封电报起个标题'
  errors.message = form.message.trim() ? '' : '正文还是空的'
  return !errors.name && !errors.email && !errors.subject && !errors.message
}

function resetForm() {
  Object.assign(form, { name: '', email: '', subject: '', message: '', botcheck: '' })
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* 静默 */
  }
}

// ===== v2.14 发送成功彩蛋：电波传输仪式 =====
// 三段式状态（电波发射 → 深空中继 → 星港签收）+ 可视化动画：
// 涟漪扩散（表单中心三圈）+ 信号光点飞向讯号区 + 回执卡弹入（GuestbookView）；
// 签收瞬间划流星护航；reduced-motion 下跳过全部动画直接给终态。
const STAGES = ['电波已发射，正奔向深空…', '深空中继站转发中…', '星港签收 ✓'] as const
const stage = ref(0)
const fxActive = ref(false)
const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
let stageTimer: ReturnType<typeof setTimeout> | null = null

function runTransmitSequence() {
  if (stageTimer) clearTimeout(stageTimer)
  if (reducedMotion) {
    finishTransmit()
    return
  }
  stage.value = 1
  fxActive.value = true // 涟漪 + 信号光点起飞（CSS 一次性动画）
  stageTimer = setTimeout(() => {
    stage.value = 2
    stageTimer = setTimeout(finishTransmit, 700)
  }, 700)
}

function finishTransmit() {
  stage.value = 3
  fxActive.value = false
  statusMsg.value = '电报已发出，站长会尽快回信 ✦ 一颗流星已划过星海为你护航，你的回执挂在上方讯号区'
  // 签收瞬间流星护航（ParticleBackground 监听此事件；发送者可感知的彩蛋提示）
  window.dispatchEvent(new CustomEvent('starlight:meteor'))
}

onBeforeUnmount(() => {
  if (stageTimer) clearTimeout(stageTimer)
})

function openMailto() {
  const body = `${form.message.trim()}\n\n—— ${form.name.trim()}（${form.email.trim()}）\n（来自星港留言板 · 联络信使）`
  const url = `mailto:${email}?subject=${encodeURIComponent(form.subject.trim())}&body=${encodeURIComponent(body)}`
  window.location.href = url
  status.value = 'mailto'
  statusMsg.value = '已唤起你的邮件客户端——邮件发出后站长就能收到 ✉'
}

async function submit() {
  if (status.value === 'sending') return
  if (!validate()) return
  if (form.botcheck) return // honeypot 命中：假装成功，不给机器人反馈

  if (!WEB3FORMS_KEY) {
    openMailto()
    return
  }

  status.value = 'sending'
  statusMsg.value = ''
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        name: form.name.trim(),
        email: form.email.trim(),
        subject: `[星港留言板] ${form.subject.trim()}`,
        message: form.message.trim(),
        botcheck: form.botcheck,
        from_name: 'Starlight 联络信使',
      }),
    })
    const result = (await res.json()) as { success?: boolean; message?: string }
    if (result.success) {
      const sender = form.name.trim()
      const subjectLine = form.subject.trim()
      status.value = 'sent'
      // 人格化彩蛋（v2.14）：三段式传输仪式 + 流星护航 + 深空讯号回执卡
      // （GuestbookView 监听 starlight:contact-sent 生成仅本次会话可见的回执）
      window.dispatchEvent(
        new CustomEvent('starlight:contact-sent', { detail: { name: sender, subject: subjectLine } }),
      )
      resetForm()
      runTransmitSequence()
    } else {
      // 服务端拒绝（配额/密钥问题）：降级 mailto，别让访客白打字
      openMailto()
      status.value = 'mailto'
      statusMsg.value = `直投通道暂时不可用（${result.message ?? '未知原因'}），已改走你的邮件客户端`
    }
  } catch {
    openMailto()
    status.value = 'mailto'
    statusMsg.value = '直投通道网络受限，已改走你的邮件客户端 ✉'
  }
}
</script>

<template>
  <form class="relative grid gap-5 md:grid-cols-2" novalidate @submit.prevent="submit">
    <!-- v2.14.1 传输动画层：涟漪扩散 + 信号光点飞向讯号区（一次性，签收后移除） -->
    <div v-if="fxActive" class="transmit-fx" aria-hidden="true">
      <span class="ripple r1"></span>
      <span class="ripple r2"></span>
      <span class="ripple r3"></span>
      <span class="signal-dot"></span>
    </div>
    <!-- honeypot：position 移出视口，机器人会填、用户看不见 -->
    <input
      v-model="form.botcheck"
      type="text"
      name="botcheck"
      tabindex="-1"
      autocomplete="off"
      aria-hidden="true"
      class="pointer-events-none absolute -left-[9999px] h-px w-px opacity-0"
    />

    <label class="block">
      <span class="mb-1.5 flex items-center justify-between text-sm text-text">
        姓名 <span class="font-mono text-[10px] uppercase tracking-widest text-text-muted/50">callsign</span>
      </span>
      <input
        v-model="form.name"
        type="text"
        :disabled="status === 'sending'"
        placeholder="怎么称呼你？"
        class="contact-input"
        :class="errors.name ? 'contact-input--err' : ''"
      />
      <span v-if="errors.name" class="mt-1 block text-xs text-accent">{{ errors.name }}</span>
    </label>

    <label class="block">
      <span class="mb-1.5 flex items-center justify-between text-sm text-text">
        邮箱 <span class="font-mono text-[10px] uppercase tracking-widest text-text-muted/50">channel</span>
      </span>
      <input
        v-model="form.email"
        type="email"
        :disabled="status === 'sending'"
        placeholder="回信发到这里"
        class="contact-input"
        :class="errors.email ? 'contact-input--err' : ''"
      />
      <span v-if="errors.email" class="mt-1 block text-xs text-accent">{{ errors.email }}</span>
    </label>

    <label class="block md:col-span-2">
      <span class="mb-1.5 flex items-center justify-between text-sm text-text">
        主题 <span class="font-mono text-[10px] uppercase tracking-widest text-text-muted/50">subject</span>
      </span>
      <input
        v-model="form.subject"
        type="text"
        :disabled="status === 'sending'"
        placeholder="一句话说明来意（友链 / 建议 / bug / 闲聊）"
        class="contact-input"
        :class="errors.subject ? 'contact-input--err' : ''"
      />
      <span v-if="errors.subject" class="mt-1 block text-xs text-accent">{{ errors.subject }}</span>
    </label>

    <label class="block md:col-span-2">
      <span class="mb-1.5 flex items-center justify-between text-sm text-text">
        消息 <span class="font-mono text-[10px] uppercase tracking-widest text-text-muted/50">payload</span>
      </span>
      <textarea
        v-model="form.message"
        rows="5"
        :disabled="status === 'sending'"
        placeholder="正文写在这里——支持换行，写多少都行"
        class="contact-input resize-y"
        :class="errors.message ? 'contact-input--err' : ''"
      ></textarea>
      <span v-if="errors.message" class="mt-1 block text-xs text-accent">{{ errors.message }}</span>
    </label>

    <div class="flex flex-wrap items-center gap-4 md:col-span-2">
      <button
        type="submit"
        class="btn-primary !px-5 !py-2.5 text-sm"
        :class="status === 'sent' ? 'btn-pop' : ''"
        :disabled="status === 'sending'"
      >
        <span v-if="status === 'sending'">发射中…</span>
        <span v-else-if="status === 'sent'">已签收 ✓</span>
        <span v-else>发送电报 ✦</span>
      </button>

      <!-- v2.14 彩蛋：电波传输仪式（三段式步骤指示器） -->
      <div v-if="status === 'sent'" class="flex flex-wrap items-center gap-1.5" aria-live="polite">
        <template v-for="(label, i) in STAGES" :key="label">
          <span
            class="flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-all duration-500"
            :class="
              stage > i
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-white/10 text-text-muted/40'
            "
          >
            <span v-if="stage > i">{{ i === 2 ? '✓' : '✦' }}</span>
            {{ label }}
          </span>
          <span v-if="i < STAGES.length - 1" class="text-text-muted/30" aria-hidden="true">→</span>
        </template>
      </div>

      <p v-if="statusMsg" aria-live="polite" class="text-sm text-primary w-full sm:w-auto">
        {{ statusMsg }}
      </p>
      <p v-else class="text-xs text-text-muted/60">草稿自动保留在本机，没写完也不怕丢</p>
    </div>
  </form>
</template>

<style scoped>
/* ===== v2.14.1 传输动画（GPU 友好：transform/opacity） ===== */
.transmit-fx {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}
/* 电波涟漪：表单中下部三圈扩散 */
.ripple {
  position: absolute;
  left: 50%;
  top: 65%;
  width: 14px;
  height: 14px;
  margin: -7px 0 0 -7px;
  border-radius: 50%;
  border: 2px solid var(--color-primary);
  opacity: 0;
  animation: ripple-out 1.15s cubic-bezier(0.2, 0.6, 0.35, 1) forwards;
}
.r2 {
  animation-delay: 0.22s;
}
.r3 {
  animation-delay: 0.44s;
}
@keyframes ripple-out {
  0% {
    transform: scale(0.6);
    opacity: 0.75;
  }
  100% {
    transform: scale(30);
    opacity: 0;
  }
}
/* 信号光点：从表单起飞，弧线飞向左上方讯号区，尾焰渐隐 */
.signal-dot {
  position: absolute;
  left: 50%;
  top: 65%;
  width: 11px;
  height: 11px;
  margin: -5px 0 0 -5px;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow:
    0 0 14px 4px color-mix(in oklab, var(--color-primary) 65%, transparent),
    0 0 34px 10px color-mix(in oklab, var(--color-accent) 35%, transparent);
  animation: signal-fly 1.5s cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards;
}
@keyframes signal-fly {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  55% {
    transform: translate(-9vw, -46vh) scale(1.05);
    opacity: 1;
  }
  100% {
    transform: translate(-16vw, -88vh) scale(0.4);
    opacity: 0;
  }
}
/* 签收后按钮弹跳一次 */
.btn-pop {
  animation: btn-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes btn-pop {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.09);
  }
  100% {
    transform: scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ripple,
  .signal-dot,
  .btn-pop {
    animation: none;
  }
}

.contact-input {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid color-mix(in oklab, var(--color-text) 14%, transparent);
  background: color-mix(in oklab, var(--color-surface) 70%, transparent);
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  color: var(--color-text);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.contact-input::placeholder {
  color: color-mix(in oklab, var(--color-text-muted) 70%, transparent);
}
.contact-input:focus {
  border-color: color-mix(in oklab, var(--color-primary) 60%, transparent);
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--color-primary) 18%, transparent);
}
.contact-input--err {
  border-color: color-mix(in oklab, var(--color-accent) 60%, transparent);
}
</style>
