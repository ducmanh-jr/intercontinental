import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/main.css'

createApp(App).use(router).mount('#app')

// 应用挂载后移除首屏加载指示
const hint = document.getElementById('boot-hint')
if (hint) {
  hint.style.opacity = '0'
  setTimeout(() => hint.remove(), 350)
}
