import { createRouter, createWebHistory } from 'vue-router'
import type { RouteComponent } from 'vue-router'
import { particlesState } from '@/stores/particles'
import { loadingState } from '@/stores/loading'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: '首页', particles: 'high' },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
      meta: { title: '关于', particles: 'low' },
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/views/ProjectsView.vue'),
      meta: { title: '项目', particles: 'low' },
    },
    {
      path: '/blog',
      name: 'blog',
      component: () => import('@/views/BlogListView.vue'),
      meta: { title: '博客', particles: 'low' },
    },
    {
      path: '/blog/:slug',
      name: 'blog-post',
      component: () => import('@/views/BlogPostView.vue'),
      meta: { title: '文章', particles: 'off' },
    },
    {
      path: '/now',
      name: 'now',
      component: () => import('@/views/NowView.vue'),
      meta: { title: '日志', particles: 'low' },
    },
    {
      path: '/friends',
      name: 'friends',
      component: () => import('@/views/FriendsView.vue'),
      meta: { title: '友邻', particles: 'low' },
    },
    {
      path: '/guestbook',
      name: 'guestbook',
      component: () => import('@/views/GuestbookView.vue'),
      meta: { title: '留言', particles: 'low' },
    },
    {
      path: '/versions',
      name: 'versions',
      component: () => import('@/views/VersionArchiveView.vue'),
      meta: { title: '版本', particles: 'low' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: '404', particles: 'low' },
    },
  ],
})

// beforeEach→afterEach 覆盖懒加载分包下载窗口；失败路径由 onError 清理
router.beforeEach(() => {
  loadingState.navigating = true
})

router.afterEach((to) => {
  loadingState.navigating = false
  // 导航成功即清除 chunk 自愈标记：本窗口部署期已过，下次部署仍可自愈一次
  try {
    sessionStorage.removeItem('starlight:chunk-reloaded')
  } catch {
    /* 静默 */
  }
  const siteName = '个人网站'
  document.title = to.meta.title ? `${to.meta.title} | ${siteName}` : siteName
  particlesState.density = to.meta.particles ?? 'low'
})

router.onError((error) => {
  loadingState.navigating = false
  // v2.12.1 陈旧缓存自愈：GitHub Pages 部署后，旧 HTML 引用的旧分包会 404，
  // 路由懒加载失败 → 页面空白。检测到 chunk 加载失败时整页刷新拉新 HTML（一次为限，防循环）。
  const chunkFail =
    error instanceof Error &&
    /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
      error.message,
    )
  if (chunkFail) {
    try {
      if (!sessionStorage.getItem('starlight:chunk-reloaded')) {
        sessionStorage.setItem('starlight:chunk-reloaded', '1')
        window.location.reload()
      }
    } catch {
      /* storage 不可用时放弃自愈 */
    }
  }
})

// 空闲时后台预取全部分包：用户首次点击导航时模块已在缓存（慢链路关键优化）
// 注：vue-router 5 中 record.components 是 Record<string, RawRouteComponent>（非数组），
// 需用 Object.values 取出各懒加载函数。
function prefetchAllRoutes() {
  const idle =
    'requestIdleCallback' in window
      ? window.requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 2000)
  idle(() => {
    router.getRoutes().forEach((r) => {
      const comps = r.components ? Object.values(r.components) : []
      comps.forEach((c) => {
        if (typeof c === 'function') {
          // 本工程全部路由均为 () => import(...) 懒加载器，此处断言为 Lazy<RouteComponent>
          Promise.resolve((c as () => Promise<RouteComponent>)()).catch(() => {
            /* 预取失败静默（真导航时再试） */
          })
        }
      })
    })
  })
}
prefetchAllRoutes()

export default router
