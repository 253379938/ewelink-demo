import { createApp } from 'vue'
import App from './App.vue'
import '@/style.css'
import 'element-plus/dist/index.css'
import router from '@/router/index'

createApp(App).use(router).mount('#app')
