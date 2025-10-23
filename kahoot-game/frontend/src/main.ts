import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'

// 啟用全域調試日誌視窗（需在專案根目錄存在 debug-log.js）
import '../debug-log.js'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
