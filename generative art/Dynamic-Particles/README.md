# ✨ 3D Dynamic Particles | 灵动粒子 基于Gemini的集大成作

> **以手势为笔，以粒子为墨，在浏览器中触碰三维数学之美。**
> *Touch the beauty of 3D mathematics in your browser, using gestures as your pen and particles as your ink.*

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-r136-black)](https://threejs.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-green)](https://google.github.io/mediapipe/)

---

## 📖 简介 (Introduction)

这是一个基于 **Three.js** 和 **MediaPipe** 构建的轻量级 Web 3D 交互实验。它摒弃了传统的鼠标点击，通过摄像头实时捕捉手势，让用户能够“隔空”操控数万个发光粒子，使其在不同的数学模型之间流畅变换。

本项目实现了全平台兼容（PC/平板/手机），并针对移动端 GPU 进行了深度性能优化，提供丝滑的 60FPS 体验。

现已部署在https://haemorr.online/ 欢迎访问

## 🌟 核心亮点 (Key Features)

### 1. 🤖 次世代 AI 手势交互
告别枯燥的点击，体验钢铁侠般的操控感：
*   **👋 实时缩放**：张开或捏合双指，粒子群随心律动。
*   **✋ 3D 旋转**：移动手腕位置，全方位观察模型细节。
*   **✊ 轴向锁定**：**左手握拳**时，自动锁定旋转轴，仅允许精细缩放操作。
*   **🙌 双拳重置**：**双手同时握拳**，模型瞬间回归初始状态，交互零延迟。
*   **🧠 智能侧边栏UI**：识别到操作手势 3 秒后，侧边栏自动收起，提供沉浸式视觉体验。

### 2. 🎨 数学驱动的粒子艺术
拒绝贴图堆砌，每一个形态都由纯粹的数学公式生成：
*   ❤️ **挚爱之心**：基于隐函数曲面生成的饱满桃心，表面圆润外凸。
*   🌌 **浩瀚银河**：经典的对数螺旋算法，还原星系悬臂的深邃与流动。
*   🌹 **繁花盛宴**：多层正弦波叠加与层级算法，构建出立体绽放的玫瑰。
*   🌲 **迷雾森林**：利用斐波那契（黄金角）螺旋分布种植树木，配合随机化树冠与地被，拒绝呆板排列。
*   🧬 **生命螺旋**：双螺旋结构与碱基对的完美几何演绎。

### 3. 💎 极致的 UI 与细节
*   **Glassmorphism 设计**：全套 UI 采用现代毛玻璃风格，磨砂质感，轻盈悬浮。
*   **深/浅色模式**：一键切换“清新日间”与“深空黑夜”主题，粒子混合模式（Blending）随背景自动切换。
*   **原生级取色器**：集成系统级颜色选择器，支持 Hex/RGB 精准控色，粒子边缘采用程序化径向渐变，杜绝黑边。

## 🛠️ 技术栈 (Tech Stack)

*   **渲染引擎**: Three.js (WebGL)
*   **计算机视觉**: Google MediaPipe Hands
*   **开发语言**: Vanilla JavaScript (ES6+)
*   **样式布局**: CSS3 (Flexbox, Backdrop-filter)
*   **部署**: Cloudflare Pages / GitHub Pages

## 🚀 快速开始 (Getting Started)

1.  完全开源 喜欢的话给个star吧
2.  使用 Live Server 或任意静态服务器打开 `index.html`。
3.  **注意**：由于浏览器安全策略，调用摄像头必须使用 `https://` 协议或 `localhost`。

## 📱 兼容性

| 平台 | 体验 | 优化策略 |
| :--- | :--- | :--- |
| **PC (Chrome/Edge)** | ⭐⭐⭐⭐⭐ | 25,000+ 粒子，全特效开启 |
| **iPad/Android Tablet** | ⭐⭐⭐⭐⭐ | 自动适配横屏，前置摄像头优化 |
| **Mobile Phone** | ⭐⭐⭐⭐ | 自动降级粒子数至 8,000，保证流畅度 |

---

**Made with ❤️ by Haemorr**
