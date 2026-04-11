import { createApp } from 'vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './style.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// 全局配置 axios
axios.defaults.baseURL = 'http://111.229.25.160:8001'
// 配置数组参数序列化：将 regional_managers[]=a&regional_managers[]=b 转换为 regional_managers=a&regional_managers=b
axios.defaults.paramsSerializer = {
  indexes: null
}

createApp(App).use(router).mount('#app')