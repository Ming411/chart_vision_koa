import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import axios from 'axios'
// 引入全局样式
import '@/assets/css/global.less'
import '@/assets/font/iconfont.css'
import SocketService from '@/utils/socket_service'
// 对服务器进行websocket的连接
SocketService.Instance.connect()
Vue.prototype.$socket = SocketService.Instance

axios.defaults.baseURL = 'http://127.0.0.1:8888/api/'
// 将axios挂载到全局
Vue.prototype.$http = axios
// 将echarts挂载到全局
// 已经在html中引入了echarts的JS文件
Vue.prototype.$echarts = window.echarts
Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
