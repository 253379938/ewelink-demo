import { createApp } from 'vue'
import App from './App.vue'
import '@/style.css'
import 'element-plus/dist/index.css'
import router from '@/router/index'
import pinia from '@/store/index'

createApp(App).use(router).use(pinia).mount('#app')
