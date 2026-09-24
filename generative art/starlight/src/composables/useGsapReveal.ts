import { onUnmounted, watch, type Ref } from 'vue'

/**
 * 滚动揭示动画。gsap 动态导入（首屏不进主包），初始化在 scope 就绪后异步加载。
 * 类型：gsap 的 Context 等类型在全局 namespace（gsap），值类型用 typeof import 查询。
 */
type GsapApi = (typeof import('gsap'))['default']
type GsapCtx = gsap.Context

export function useGsapReveal(
  scope: Ref<HTMLElement | null>,
  options: { y?: number; stagger?: number } = {},
) {
  const { y = 40, stagger = 0.05 } = options
  let gsap: GsapApi | null = null
  let ctx: GsapCtx | null = null
  let observer: IntersectionObserver | null = null

  async function setup(el: HTMLElement) {
    // reduced-motion：不隐藏元素、不建 IO，直接呈现终态
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }
    gsap ??= (await import('gsap')).default
    ctx?.revert()          // 防止 scope 重复填充时旧 tween/context 泄漏
    observer?.disconnect() // 防止旧 IntersectionObserver 持有已分离节点
    ctx = gsap.context(() => {
      const items = el.querySelectorAll('[data-reveal]')
      gsap!.set(items, { opacity: 0, y })
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            const target = entry.target as HTMLElement
            const index = Number(target.dataset.index ?? 0)
            gsap!.to(target, {
              opacity: 1,
              y: 0,
              duration: 0.45,
              ease: 'power3.out',
              delay: index * stagger,
            })
            observer?.unobserve(target) // 进入一次即停
          }
        },
        { threshold: 0.1 },
      )
      items.forEach((el, i) => {
        ;(el as HTMLElement).dataset.index = String(i)
        observer?.observe(el)
      })
    }, el)
  }

  watch(scope, (el) => {
    if (el) void setup(el)
  })

  onUnmounted(() => {
    observer?.disconnect()
    ctx?.revert()
  })
}
