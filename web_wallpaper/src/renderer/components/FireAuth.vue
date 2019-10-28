<template>
    <div id="firebaseui-auth-container"></div>
</template>
<script>
import firebase from 'firebase';
import firebaseui from 'firebaseui'
import {config} from '../config/firebaseConfig'
export default {
  name: 'fire_auth',
  mounted() {
    var uiConfig = {
      signInSuccessUrl: '/fire_success',
      signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID
        ]
      };
    const orig = firebase.INTERNAL.node;
    delete firebase.INTERNAL.node;
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    ui.start('#firebaseui-auth-container', uiConfig);
    },
}
</script>