import Vue from 'vue'
import Router from 'vue-router'
import Loading from '../components/Loading'
import LandingPage from '../components/LandingPage.vue'
import Home from '../components/Home.vue'

Vue.use(Router)

export default new Router({
  routes: [
    { path: '/', component: Loading },
    { path: '/landing_page', component: LandingPage },
    { path: '/home', component: Home },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
