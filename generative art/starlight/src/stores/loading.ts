import { reactive } from 'vue'

// 纯 Vue reactive 单例（非 Pinia），由 router.beforeResolve / afterEach 写入
export const loadingState = reactive({ navigating: false })
