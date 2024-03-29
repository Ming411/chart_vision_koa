import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [{
  path: '/',
  redirect: '/screen'
}, {
  path: '/screen',
  component: () => import('@/views/ScreenPage')
}]

const router = new VueRouter({
  routes
})

export default router
