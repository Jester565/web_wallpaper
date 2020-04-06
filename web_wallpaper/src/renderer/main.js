import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'
import firebase from 'firebase'
import ipcHelper from './utils/ipcHelper'
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
    this.userHasExisted = false;
    firebase.auth().onIdTokenChanged(async (user) => {
      if (user) {
        this.userHasExisted = true;
        let idToken = await user.getIdToken();
        ipcHelper.invoke('set-auth', 'set-auth-resp', { idToken, refreshToken: user.refreshToken } );
      }
    });
    firebase.auth().onAuthStateChanged((user) => {
      if(user) {
        this.$router.push('/home');
      } else if (!this.userHasExisted) {
        this.$router.push('/landing_page')
      }
     });
    },
  store,
  template: '<App/>'
}).$mount('#app')
