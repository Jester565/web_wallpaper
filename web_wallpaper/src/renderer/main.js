import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'
import firebase from 'firebase'
import firebaseui from 'firebaseui'
import {config} from './config/firebaseConfig'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  created() {
    firebase.initializeApp(config);
    firebase.auth().onAuthStateChanged((user) => {
      if(user) {
        this.$router.push('/home')
      } else {
        this.$router.push('/landing_page')
      }
     });
    },
  store,
  template: '<App/>'
}).$mount('#app')
