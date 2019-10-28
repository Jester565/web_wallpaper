import Vue from 'vue'
import Router from 'vue-router'
import FireAuth from '../components/FireAuth.vue'
import FireSuccess from '../components/FireSuccess.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: require('@/components/LandingPage').default
    },
    { path: '/fire_auth', component: FireAuth },
    { path: '/fire_success', component: FireSuccess },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
