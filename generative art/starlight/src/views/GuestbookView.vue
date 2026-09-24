<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import GiscusComments from '@/components/blog/GiscusComments.vue'
import ContactForm from '@/components/ui/ContactForm.vue'
import { useGsapReveal } from '@/composables/useGsapReveal'

const scopeRef = ref<HTMLElement | null>(null)
useGsapReveal(scopeRef)

// 已捕获的深空讯号（v1.7 装饰彩蛋）：风格化系统日志，留言正片在下方 Giscus 区。
// v2.14：发送电报成功后，访客自己的电波也会追加为一张「回执卡」（仅本次会话，刷新即散）
interface Signal {
  from: string
  time: string
  text: string
  receipt?: boolean
}
const capturedSignals = ref<Signal[]>([
  {
    from: '星港主控 AI',
    time: '00:00:07',
    text: '检测到访客接近。已点亮走廊灯光，咖啡机预热中 ☕',
  },
  {
    from: '银河货运工会',
    time: '03:14:15',
    text: '您预定的「灵感」包裹已到货，签收码 √2。逾期将退回深空。',
  },
  {
    from: '未来的你',
    time: '∞',
    text: '代码写完了吗？没写完也没关系，先给现在的自己留句话吧。',
  },
])

// v2.14 彩蛋联动：ContactForm 发送成功广播 starlight:contact-sent → 追加回执卡
// v2.14.1：回执卡弹入动画 + 平滑滚动到可视区（reduced-motion 直接跳转）
let receiptEl: HTMLElement | null = null
function setReceiptRef(el: unknown) {
  if (el instanceof HTMLElement) receiptEl = el
}
async function onContactSent(e: Event) {
  const detail = (e as CustomEvent<{ name: string; subject: string }>).detail
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  capturedSignals.value.push({
    from: `${detail.name || '无名旅行者'}（你）`,
    time: `${hh}:${mm}:${ss}`,
    text: `主题「${detail.subject || '无题'}」的电波已被星港签收。这条回执只存在于当前页面——刷新后随电波消散 ✦`,
    receipt: true,
  })
  await nextTick()
  receiptEl?.scrollIntoView({
    behavior: reducedMotion() ? 'auto' : 'smooth',
    block: 'center',
  })
}
function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
onMounted(() => window.addEventListener('starlight:contact-sent', onContactSent))
onUnmounted(() => window.removeEventListener('starlight:contact-sent', onContactSent))
</script>

<template>
  <section ref="scopeRef" class="section-container relative min-h-[60vh]">
    <SectionTitle
      over="Guestbook"
      title="星语留言板"
      as="h1"
      subtitle="把想说的话写成光发过来——私密信件走上面的联络信使，公开留言在下方登录 GitHub 发射"
    />

    <!-- 已捕获的深空讯号（v2.9 重设计）：信号强度条 + 呼吸圆点 + 时间戳角标；
         v2.14：发送电报成功后追加你的「回执卡」（全宽 + 主色描边，刷新即散） -->
    <div data-reveal class="grid gap-4 md:grid-cols-3">
      <div
        v-for="(s, i) in capturedSignals"
        :key="s.from + s.time"
        :ref="s.receipt ? setReceiptRef : undefined"
        class="card group relative overflow-hidden p-5 font-mono transition-[transform,border-color] duration-300 hover:-translate-y-1"
        :class="s.receipt ? 'receipt-card border-primary/40 md:col-span-3' : ''"
      >
        <!-- 顶部信号强度装饰 -->
        <span aria-hidden="true" class="absolute right-4 top-4 flex items-end gap-[3px]">
          <span
v-for="b in 4" :key="b" class="w-[3px] rounded-sm transition-all duration-300"
            :class="s.receipt || b <= (3 - i) ? 'bg-primary/80' : 'bg-text-muted/20 group-hover:bg-primary/40'"
            :style="{ height: 4 + b * 3 + 'px' }"></span>
        </span>
        <p class="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-text-muted/50">
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 [animation-duration:2.2s]"></span>
            <span class="relative inline-flex h-2 w-2 rounded-full bg-primary/80"></span>
          </span>
          {{ s.from }}
          <span v-if="s.receipt" class="rounded-full border border-primary/40 px-1.5 py-px text-[9px] text-primary">回执</span>
        </p>
        <p class="mt-3 text-sm leading-6" :class="s.receipt ? 'text-text' : 'text-text-muted'">{{ s.text }}</p>
        <p class="mt-3 border-t border-white/5 pt-2 text-[10px] tracking-widest text-text-muted/40">
          T+{{ s.time }} · {{ s.receipt ? 'SIGNED · SESSION ONLY' : 'SIGNAL LOCKED' }}
        </p>
      </div>
    </div>

    <div class="star-divider my-12" aria-hidden="true"><span>✦</span></div>

    <!-- 联络信使（v2.11）：四字段电报，Web3Forms 直投 / mailto 降级双通道 -->
    <div data-reveal class="card mx-auto max-w-2xl p-6 md:p-8">
      <div class="mb-6 flex items-baseline justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold">联络信使 ✉</h2>
          <p class="mt-1 text-sm text-text-muted">
            像发邮件一样给站长发一封电报——不用登录，写下即发。<br class="hidden sm:block" />
            <span class="text-text-muted/70">发送成功后会有一场小小的传输仪式，你的回执将挂进上方讯号区 ✦</span>
          </p>
        </div>
        <span class="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/40 sm:block"
          >Contact Beacon</span
        >
      </div>
      <ContactForm />
    </div>

    <div class="star-divider my-12" aria-hidden="true"><span>✦</span></div>

    <!-- 正片：Giscus 留言区（GitHub 登录后可发星际弹幕） -->
    <div data-reveal class="mx-auto max-w-2xl text-center">
      <p class="text-sm leading-7 text-text-muted">
        想留下公开的足迹？在下面和路过星港的旅行者们打个招呼——<br />
        留言通过 GitHub Discussions 存储，登录 GitHub 即可发射。
      </p>
    </div>
    <div class="mx-auto max-w-2xl">
      <GiscusComments />
    </div>
  </section>
</template>

<style scoped>
/* v2.14.1 回执卡入场：上浮弹入 + 主色光晕一闪（仅新插入的 receipt 卡携带此类） */
.receipt-card {
  animation: receipt-in 0.85s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes receipt-in {
  0% {
    opacity: 0;
    transform: translateY(26px) scale(0.96);
    box-shadow: 0 0 0 0 color-mix(in oklab, var(--color-primary) 55%, transparent);
  }
  55% {
    opacity: 1;
    box-shadow: 0 0 34px 6px color-mix(in oklab, var(--color-primary) 35%, transparent);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    box-shadow: 0 0 0 0 transparent;
  }
}
@media (prefers-reduced-motion: reduce) {
  .receipt-card {
    animation: none;
  }
}
</style>
