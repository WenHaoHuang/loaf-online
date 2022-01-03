import { createApp } from 'vue'

import ElementPlus from 'element-plus'
import 'element-plus/theme-chalk/el-reset.css'
import 'element-plus/dist/index.css'
import './style/index.scss'

import App from './App.vue'
import router from './router'
import store from './store'

createApp(App)
  .use(store)
  .use(router)
  .use(ElementPlus, { size: 'small' })
  .mount('#app')
