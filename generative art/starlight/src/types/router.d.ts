import 'vue-router'
import type { ParticleDensity } from '@/stores/particles'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    particles?: ParticleDensity
  }
}
