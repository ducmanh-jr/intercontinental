import * as THREE from 'three'
import vertexShader from './shaders/particles.vert?raw'
import fragmentShader from './shaders/particles.frag?raw'
import meteorVertexShader from './shaders/meteor.vert?raw'
import meteorFragmentShader from './shaders/meteor.frag?raw'
import { resolveParticleCount, type ParticleDensity } from '@/stores/particles'

export interface ParticleSceneOptions {
  count: number
  colorA: string
  colorB: string
  /** 导航主星数量（默认 6，0 表示不构建） */
  navStars?: number
}

interface ParticleLayer {
  group: THREE.Group
  points: THREE.Points
  geometry: THREE.BufferGeometry
  material: THREE.ShaderMaterial
  baseCount: number
  parallaxFactor: number
}

interface NebulaDrift {
  baseX: number
  baseY: number
  speed: number
  phase: number
  axisX: number
  axisY: number
}

/** 三层景深粒子 baseCount 总和（密度 ratio 的分母，预算 1000 不变） */
const TOTAL_BASE_COUNT = 1000
/** 流星周期（秒），Plan §14 要求 40-70s */
const METEOR_PERIOD = 50
/** 流星进度初始相位 */
const METEOR_PHASE = 0.13

export class ParticleScene {
  private renderer: THREE.WebGLRenderer | null = null
  private scene: THREE.Scene | null = null
  private camera: THREE.PerspectiveCamera | null = null
  private layers: ParticleLayer[] = []
  private navPoints: THREE.Points | null = null
  private navGeometry: THREE.BufferGeometry | null = null
  private navMaterial: THREE.ShaderMaterial | null = null
  private navGroup: THREE.Group | null = null
  private navCount = 0
  private hoveredIndex: number | null = null
  private nebulaGroup: THREE.Group | null = null
  private nebulaTexture: THREE.Texture | null = null
  private meteorPoints: THREE.Points | null = null
  private meteorGeometry: THREE.BufferGeometry | null = null
  private meteorMaterial: THREE.ShaderMaterial | null = null
  /** v1.4 打字即流星：相位偏移，供 burstMeteor 把 tick 重算的 uProgress 立即归零 */
  private meteorPhaseOffset = 0
  private colorA = '#22d3ee'
  private colorB = '#8b5cf6'
  private raycaster = new THREE.Raycaster()
  private repelRaycaster = new THREE.Raycaster()
  private repelPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  private rafId = 0
  private clock = new THREE.Clock()
  private elapsed = 0
  private renderedStatic = false
  private parallaxTarget = { x: 0, y: 0 }
  private density: ParticleDensity = 'off'
  private isMobile = false
  private pageVisible = true
  private reducedMotion = false
  private disposed = false
  private initialized = false
  private onResizeBound = () => this.onResize()
  private onVisibilityBound = () => this.onVisibility()

  constructor(private canvas: HTMLCanvasElement) {}

  init(options: ParticleSceneOptions): void {
    if (this.initialized) return
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    )
    this.camera.position.z = 30

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.colorA = options.colorA
    this.colorB = options.colorB
    this.buildLayers()
    const navStars = options.navStars ?? 6
    if (navStars > 0) this.buildNavStars(navStars)
    this.buildNebula()
    this.buildMeteor()
    this.applyDensity()

    window.addEventListener('resize', this.onResizeBound)
    document.addEventListener('visibilitychange', this.onVisibilityBound)
    this.onResize()
    this.disposed = false
    this.initialized = true
    this.tick()
  }

  setDensity(density: ParticleDensity): void {
    this.density = density
    this.applyDensity()
  }

  /** v2.11 主题场景化：运行时把星空整体换色（粒子双色 + 暖星 + 星云 tint + 流星）。
   *  颜色写入已有材质 uniforms，不重建几何，零 GC 压力，切换即时生效。 */
  setTheme(colorA: string, colorB: string, warm: string, meteor: string): void {
    this.colorA = colorA
    this.colorB = colorB
    const a = new THREE.Color(colorA)
    const b = new THREE.Color(colorB)
    const w = new THREE.Color(warm)
    for (const layer of this.layers) {
      const u = layer.material.uniforms
      ;(u.uColorA.value as THREE.Color).copy(a)
      ;(u.uColorB.value as THREE.Color).copy(b)
      ;(u.uColorC.value as THREE.Color).copy(w)
    }
    if (this.navMaterial) {
      const u = this.navMaterial.uniforms
      ;(u.uColorA.value as THREE.Color).copy(a)
      ;(u.uColorB.value as THREE.Color).copy(b)
      ;(u.uColorC.value as THREE.Color).copy(w)
    }
    // 星云 tint 交替 A/B 色（buildNebula 同规则）
    this.nebulaGroup?.children.forEach((child, i) => {
      const mat = (child as THREE.Sprite).material as THREE.SpriteMaterial
      mat.color.copy(i % 2 === 0 ? a : b)
    })
    if (this.meteorMaterial) (this.meteorMaterial.uniforms.uColor.value as THREE.Color).set(meteor)
  }

  setMobile(isMobile: boolean): void {
    this.isMobile = isMobile
    this.applyDensity()
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced
    if (!reduced) this.renderedStatic = false
    this.syncMeteorVisibility() // §14：流星是动态效果，reduced-motion 下隐藏而非冻结
  }

  setParallaxTarget(x: number, y: number): void {
    this.parallaxTarget.x = x
    this.parallaxTarget.y = y
  }

  /** 鼠标排斥场中心（client 坐标 → 中层层内局部坐标），reduced-motion/移动端忽略 */
  setRepelPoint(clientX: number, clientY: number): void {
    if (this.reducedMotion || this.isMobile || this.disposed) return
    if (!this.camera || !this.renderer || this.layers.length < 2) return
    const rect = this.renderer.domElement.getBoundingClientRect()
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )
    this.repelRaycaster.setFromCamera(ndc, this.camera)
    const worldPoint = new THREE.Vector3()
    // 鼠标射线与 z=0 平面求交（粒子盒中心平面）
    if (!this.repelRaycaster.ray.intersectPlane(this.repelPlane, worldPoint)) return
    // 主层（视差系数 0.7）旋转的逆变换，得到局部坐标（各层统一使用）
    const midGroup = this.navGroup ?? this.layers[1]?.group
    if (midGroup) {
      const rot = midGroup.rotation
      worldPoint.applyEuler(new THREE.Euler(-rot.x, -rot.y, -rot.z, rot.order))
    }
    for (const layer of this.layers) {
      const u = layer.material.uniforms
      u.uMouse.value.copy(worldPoint)
      u.uRepelRadius.value = 6
      u.uRepelStrength.value = 0.5
    }
  }

  clearRepelPoint(): void {
    for (const layer of this.layers) {
      layer.material.uniforms.uRepelStrength.value = 0
    }
  }

  /** v1.4 打字即流星：把流星进度立即重置（回到星轨起点，从头划过）。
   *  tick 每帧由 CPU 重算 uProgress（elapsed/周期 + 相位），直接改 uniform 下一帧即被覆盖，
   *  故改为调整相位偏移使下一帧进度归零（等效于把 uProgress 立即重置到 1.0 的环绕点）。 */
  burstMeteor(): void {
    if (!this.meteorMaterial) return
    const x = this.elapsed / METEOR_PERIOD + METEOR_PHASE
    const current = (x + this.meteorPhaseOffset) % 1.0
    this.meteorPhaseOffset = (this.meteorPhaseOffset - current + 1) % 1.0
  }

  private applyDensity(): void {
    if (this.layers.length === 0) return
    const count = resolveParticleCount(this.density, this.isMobile)
    const ratio = count / TOTAL_BASE_COUNT
    for (const layer of this.layers) {
      const visibleCount = Math.floor(layer.baseCount * ratio)
      layer.geometry.setDrawRange(0, visibleCount)
      layer.points.visible = visibleCount > 0
    }
    // 主星与主粒子同规则隐藏（density off / 移动端）
    if (this.navPoints) {
      this.navPoints.visible = count > 0
      if (!this.navPoints.visible) this.setNavStarHover(null)
    }
    if (this.nebulaGroup) this.nebulaGroup.visible = count > 0
    this.syncMeteorVisibility() // 与密度联动：count > 0 且非 reduced-motion（§14：reduced-motion/移动端隐藏）
    if (count > 0) {
      this.renderedStatic = false // 密度 off→on 恢复时重置静态帧标记（§5.3）
    } else {
      this.clearRepelPoint()
      // 清掉上一帧残留画面，防止"冻结星空"（alpha renderer 清为透明）
      this.renderer?.clear()
    }
  }

  /** 流星可见性 = 密度非零（桌面非 off）且非 reduced-motion；setReducedMotion 与 applyDensity 共用，避免互相覆盖 */
  private syncMeteorVisibility(): void {
    if (!this.meteorPoints) return
    this.meteorPoints.visible =
      resolveParticleCount(this.density, this.isMobile) > 0 && !this.reducedMotion
  }

  /** 三层景深粒子（远/中/近），每层独立 group（视差系数）+ geometry/material（uniforms 独立） */
  private buildLayers(): void {
    if (!this.scene) return
    const specs = [
      {
        baseCount: 100,
        zMin: -35,
        zMax: -20,
        sizeMin: 0.3,
        sizeMax: 1.0,
        speedMin: 0.05,
        speedMax: 0.2,
        parallaxFactor: 0.35,
      },
      {
        baseCount: 620,
        zMin: -20,
        zMax: 15,
        sizeMin: 0.4,
        sizeMax: 2.0,
        speedMin: 0.1,
        speedMax: 0.5,
        parallaxFactor: 0.7,
      },
      {
        baseCount: 280,
        zMin: 15,
        zMax: 25,
        sizeMin: 1.4,
        sizeMax: 3.2,
        speedMin: 0.4,
        speedMax: 0.8,
        parallaxFactor: 1.15,
      },
    ]
    for (const spec of specs) {
      const positions = new Float32Array(spec.baseCount * 3)
      const sizes = new Float32Array(spec.baseCount)
      const radii = new Float32Array(spec.baseCount)
      const speeds = new Float32Array(spec.baseCount)
      const drifts = new Float32Array(spec.baseCount)
      const colorMixes = new Float32Array(spec.baseCount)
      const hovers = new Float32Array(spec.baseCount)
      const warms = new Float32Array(spec.baseCount)
      const navs = new Float32Array(spec.baseCount)

      // 粒子散布在 60×36 的扁盒内，z 按层分布在相机（z=30）前方
      for (let i = 0; i < spec.baseCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 60
        positions[i * 3 + 1] = (Math.random() - 0.5) * 36
        positions[i * 3 + 2] = spec.zMin + Math.random() * (spec.zMax - spec.zMin)
        sizes[i] = spec.sizeMin + Math.random() * (spec.sizeMax - spec.sizeMin)
        radii[i] = Math.random() * 1.2 + 0.2
        speeds[i] = spec.speedMin + Math.random() * (spec.speedMax - spec.speedMin)
        drifts[i] = Math.random() * Math.PI * 2
        colorMixes[i] = Math.random()
        hovers[i] = 0
        warms[i] = Math.random() < 0.05 ? 1 : 0 // 5% 概率暖星
        navs[i] = 0
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
      geometry.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1))
      geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
      geometry.setAttribute('aDrift', new THREE.BufferAttribute(drifts, 1))
      geometry.setAttribute('aColorMix', new THREE.BufferAttribute(colorMixes, 1))
      geometry.setAttribute('aHover', new THREE.BufferAttribute(hovers, 1))
      geometry.setAttribute('aWarm', new THREE.BufferAttribute(warms, 1))
      geometry.setAttribute('aNav', new THREE.BufferAttribute(navs, 1))

      const material = this.makeParticleMaterial()
      const points = new THREE.Points(geometry, material)
      points.frustumCulled = false
      const group = new THREE.Group()
      group.add(points)
      this.scene.add(group)
      this.layers.push({
        group,
        points,
        geometry,
        material,
        baseCount: spec.baseCount,
        parallaxFactor: spec.parallaxFactor,
      })
    }
  }

  /** 导航主星：环绕视野中部的环带，与主粒子共用同一 shader（aHover 高亮 + aNav 十字星芒） */
  private buildNavStars(count: number): void {
    if (!this.scene) return
    // 主星并入中层 group（视差系数 0.7，与主星 z 范围一致）
    const midGroup = this.layers[1]?.group
    if (!midGroup) return
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const radii = new Float32Array(count)
    const speeds = new Float32Array(count)
    const drifts = new Float32Array(count)
    const colorMixes = new Float32Array(count)
    const hovers = new Float32Array(count)
    const warms = new Float32Array(count)
    const navs = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      positions[i * 3] = Math.cos(angle) * 18
      positions[i * 3 + 1] = Math.sin(angle) * 6
      positions[i * 3 + 2] = Math.sin(angle) * 10 - 5
      sizes[i] = Math.random() * 0.6 + 2.2 // 2.2~2.8，明显大于背景粒子
      radii[i] = Math.random() * 1.2 + 0.2 // 与主粒子相同的漂移参数
      speeds[i] = Math.random() * 0.4 + 0.1
      drifts[i] = Math.random() * Math.PI * 2
      colorMixes[i] = 0.5
      hovers[i] = 0
      warms[i] = 0
      navs[i] = 1
    }

    this.navGeometry = new THREE.BufferGeometry()
    this.navGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.navGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    this.navGeometry.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1))
    this.navGeometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
    this.navGeometry.setAttribute('aDrift', new THREE.BufferAttribute(drifts, 1))
    this.navGeometry.setAttribute('aColorMix', new THREE.BufferAttribute(colorMixes, 1))
    this.navGeometry.setAttribute('aHover', new THREE.BufferAttribute(hovers, 1))
    this.navGeometry.setAttribute('aWarm', new THREE.BufferAttribute(warms, 1))
    this.navGeometry.setAttribute('aNav', new THREE.BufferAttribute(navs, 1))

    this.navMaterial = this.makeParticleMaterial()
    this.navPoints = new THREE.Points(this.navGeometry, this.navMaterial)
    this.navPoints.frustumCulled = false
    this.navCount = count
    this.navGroup = midGroup
    midGroup.add(this.navPoints)
  }

  /** 星云雾霭：12-20 个加色混合 Sprite（canvas 径向渐变纹理），慢速正弦漂移 */
  private buildNebula(): void {
    if (!this.scene) return
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // 白心 → 全透明的径向渐变
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(255,255,255,0.9)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    this.nebulaTexture = new THREE.CanvasTexture(canvas)

    const tintColors = [new THREE.Color(this.colorA), new THREE.Color(this.colorB)]
    const spriteCount = 14 + Math.floor(Math.random() * 7) // 14~20
    this.nebulaGroup = new THREE.Group()
    for (let i = 0; i < spriteCount; i++) {
      const material = new THREE.SpriteMaterial({
        map: this.nebulaTexture,
        color: tintColors[i % 2],
        transparent: true,
        opacity: 0.04 + Math.random() * 0.05, // 0.04~0.09
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const sprite = new THREE.Sprite(material)
      const scale = 18 + Math.random() * 22 // 18~40
      const baseX = (Math.random() - 0.5) * 60
      const baseY = (Math.random() - 0.5) * 36
      sprite.position.set(baseX, baseY, -8 - Math.random() * 22) // z ∈ [-30, -8]
      sprite.scale.set(scale, scale, 1)
      sprite.userData = {
        baseX,
        baseY,
        speed: 0.01 + Math.random() * 0.02, // 0.01~0.03
        phase: Math.random() * Math.PI * 2,
        axisX: 0.3 + Math.random() * 0.7, // 0.3~1.0
        axisY: 0.3 + Math.random() * 0.7,
      } satisfies NebulaDrift
      this.nebulaGroup.add(sprite)
    }
    this.scene.add(this.nebulaGroup)
  }

  /** 流星：40 顶点直线 + 专用小 shader，uProgress 周期性循环划过视野 */
  private buildMeteor(): void {
    if (!this.scene) return
    const start = new THREE.Vector3(-14, 12, -10)
    const dir = new THREE.Vector3(1, -0.45, 0.3).normalize()
    const length = 20
    const vertexCount = 40
    const positions = new Float32Array(vertexCount * 3)
    const ts = new Float32Array(vertexCount)
    for (let i = 0; i < vertexCount; i++) {
      const t = i / (vertexCount - 1)
      ts[i] = t
      positions[i * 3] = start.x + dir.x * t * length
      positions[i * 3 + 1] = start.y + dir.y * t * length
      positions[i * 3 + 2] = start.z + dir.z * t * length
    }
    this.meteorGeometry = new THREE.BufferGeometry()
    this.meteorGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.meteorGeometry.setAttribute('aT', new THREE.BufferAttribute(ts, 1))
    this.meteorMaterial = new THREE.ShaderMaterial({
      vertexShader: meteorVertexShader,
      fragmentShader: meteorFragmentShader,
      uniforms: {
        uProgress: { value: METEOR_PHASE },
        uDir: { value: dir.clone() },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uColor: { value: new THREE.Color('#8c9bff') },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.meteorPoints = new THREE.Points(this.meteorGeometry, this.meteorMaterial)
    this.meteorPoints.frustumCulled = false
    this.scene.add(this.meteorPoints)
  }

  /** 粒子/主星共用 ShaderMaterial（uniforms 独立实例，含 v1.3 新增 uniform） */
  private makeParticleMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uColorA: { value: new THREE.Color(this.colorA) },
        uColorB: { value: new THREE.Color(this.colorB) },
        uColorC: { value: new THREE.Color('#fbbf24') },
        uMouse: { value: new THREE.Vector3() },
        uRepelRadius: { value: 6 },
        uRepelStrength: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }

  /** 设置主星 hover 高亮（i 为 null 清除），aHover 属性驱动 shader 放大/增亮 */
  setNavStarHover(i: number | null): void {
    if (this.hoveredIndex === i) return
    if (this.hoveredIndex !== null && this.navGeometry) {
      const arr = this.navGeometry.getAttribute('aHover') as THREE.BufferAttribute
      arr.setX(this.hoveredIndex, 0)
      arr.needsUpdate = true
    }
    this.hoveredIndex = i
    if (i !== null && this.navGeometry) {
      const arr = this.navGeometry.getAttribute('aHover') as THREE.BufferAttribute
      arr.setX(i, 1)
      arr.needsUpdate = true
    }
  }

  /** client 坐标（px）→ 命中的主星索引或 null */
  pickNavStar(clientX: number, clientY: number): number | null {
    if (!this.navPoints || !this.camera || !this.renderer || !this.navPoints.visible) return null
    const rect = this.renderer.domElement.getBoundingClientRect()
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )
    // 主星在 shader 中漂移（最大 ~1.4 units），阈值需覆盖漂移幅度 + 星体半径，保证 hover 稳定
    this.raycaster.params.Points.threshold = 2.0
    this.raycaster.setFromCamera(ndc, this.camera)
    const hits = this.raycaster.intersectObject(this.navPoints, false)
    return hits.length > 0 ? (hits[0].index ?? null) : null
  }

  /** 主星屏幕坐标（px，供 HTML label 定位）；复刻 shader 漂移 + nav group 视差旋转 */
  navStarScreenPositions(): { x: number; y: number }[] {
    if (!this.navGeometry || !this.camera || !this.renderer || !this.scene) return []
    const navGroup = this.navGroup ?? this.layers[1]?.group
    if (!navGroup) return []
    this.scene.updateMatrixWorld() // 同步 group 视差旋转后的 world matrix
    const positions = this.navGeometry.getAttribute('position') as THREE.BufferAttribute
    const radii = this.navGeometry.getAttribute('aRadius') as THREE.BufferAttribute
    const speeds = this.navGeometry.getAttribute('aSpeed') as THREE.BufferAttribute
    const drifts = this.navGeometry.getAttribute('aDrift') as THREE.BufferAttribute
    const rect = this.renderer.domElement.getBoundingClientRect()
    const v = new THREE.Vector3()
    const out: { x: number; y: number }[] = []
    for (let i = 0; i < positions.count; i++) {
      // 与 particles.vert 的漂移公式保持一致（uTime === this.elapsed）
      const t = this.elapsed * speeds.getX(i) + drifts.getX(i)
      v.set(
        positions.getX(i) + Math.sin(t) * radii.getX(i),
        positions.getY(i) + Math.cos(t * 0.8) * radii.getX(i) * 0.6,
        positions.getZ(i) + Math.cos(t * 0.5) * radii.getX(i),
      )
      v.applyMatrix4(navGroup.matrixWorld) // 视差作用在 nav group 上，需同步变换
      v.project(this.camera)
      out.push({ x: (v.x * 0.5 + 0.5) * rect.width, y: (-v.y * 0.5 + 0.5) * rect.height })
    }
    return out
  }

  private onResize(): void {
    if (!this.renderer || !this.camera) return
    const w = window.innerWidth
    const h = window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
    const dpr = Math.min(window.devicePixelRatio, 2)
    this.renderer.setPixelRatio(dpr)
    for (const layer of this.layers) {
      layer.material.uniforms.uPixelRatio.value = dpr
    }
    if (this.navMaterial) this.navMaterial.uniforms.uPixelRatio.value = dpr
    if (this.meteorMaterial) this.meteorMaterial.uniforms.uPixelRatio.value = dpr
  }

  private onVisibility(): void {
    this.pageVisible = document.visibilityState === 'visible'
  }

  private tick = (): void => {
    if (this.disposed) return
    this.rafId = requestAnimationFrame(this.tick)
    if (!this.pageVisible || !this.renderer || !this.scene || !this.camera) {
      return
    }
    // 注意：getDelta 每帧只能调一次，勿与 getElapsedTime 混用（后者内部也调 getDelta）
    const dt = Math.min(this.clock.getDelta(), 0.05)
    if (this.reducedMotion) {
      if (this.renderedStatic) return // 只渲染一帧静态画面（§5.3）
      this.renderedStatic = true
    } else {
      this.elapsed += dt
      // 视差：指数趋近（帧率无关），按层 group × 视差系数（v1.2 作用在 scene 整体）
      const k = 2.5
      for (const layer of this.layers) {
        layer.material.uniforms.uTime.value = this.elapsed
        layer.group.rotation.y +=
          (this.parallaxTarget.x * 0.4 * layer.parallaxFactor - layer.group.rotation.y) * k * dt
        layer.group.rotation.x +=
          (-this.parallaxTarget.y * 0.2 * layer.parallaxFactor - layer.group.rotation.x) * k * dt
      }
      // 主星与主粒子共享 uTime 语义（漂移动画），需每帧同步
      if (this.navMaterial) this.navMaterial.uniforms.uTime.value = this.elapsed
      // 星云慢速正弦漂移
      if (this.nebulaGroup?.visible) {
        for (const child of this.nebulaGroup.children) {
          const sprite = child as THREE.Sprite
          const d = sprite.userData as NebulaDrift
          sprite.position.x = d.baseX + Math.sin(this.elapsed * d.speed + d.phase) * 4 * d.axisX
          sprite.position.y = d.baseY + Math.cos(this.elapsed * d.speed + d.phase) * 4 * d.axisY
        }
      }
      // 流星进度循环（周期 50s），头部最亮点随 uProgress 前进；相位偏移由 burstMeteor 调整
      if (this.meteorMaterial) {
        this.meteorMaterial.uniforms.uProgress.value =
          (this.elapsed / METEOR_PERIOD + METEOR_PHASE + this.meteorPhaseOffset) % 1.0
      }
    }
    if (!this.layers.some((layer) => layer.points.visible)) {
      return
    }
    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.initialized = false
    cancelAnimationFrame(this.rafId)
    window.removeEventListener('resize', this.onResizeBound)
    document.removeEventListener('visibilitychange', this.onVisibilityBound)
    this.scene?.traverse((obj) => {
      if (obj instanceof THREE.Points) {
        obj.geometry?.dispose()
        const mat = obj.material as THREE.ShaderMaterial | THREE.ShaderMaterial[]
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
        else mat?.dispose()
      }
      if (obj instanceof THREE.Sprite) {
        const mat = obj.material as THREE.SpriteMaterial
        mat?.dispose()
      }
    })
    this.nebulaTexture?.dispose() // 所有 Sprite 共享一张贴图，dispose 一次
    this.renderer?.dispose()
    this.renderer = null
    this.scene = null
    this.camera = null
    this.layers = []
    this.navPoints = null
    this.navGeometry = null
    this.navMaterial = null
    this.navGroup = null
    this.navCount = 0
    this.hoveredIndex = null
    this.nebulaGroup = null
    this.nebulaTexture = null
    this.meteorPoints = null
    this.meteorGeometry = null
    this.meteorMaterial = null
  }
}
