<template>
    <div>
        <div class="config-div" v-if="hasGoogleAuth">
            <span class="md-display-1">Refresh Token Detected</span>
        </div>
        <div class="config-div" v-if="hasGoogleAuth === false">
            <span class="md-display-1">Google Permissions Required!</span>
            <br />
            <span class="md-headline">Your browser will be opened for sign in</span>
            <br />
            <md-button class="md-raised md-accent" @click="launchLogin">Login With Google</md-button>
        </div>
        <div class="config-div" v-if="hasGoogleAuth == null">
            <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
        </div>
    </div>
</template>
<script>
import firebase from 'firebase';
import firebaseui from 'firebaseui';
import axios from 'axios';
import _ from 'lodash';
import router from 'vue-router';
import ipcHelper from '../../utils/ipcHelper';
import { AUTH_URL, CLIENT_ID, API_URL } from '../../../constants';
import querystring from 'querystring';
const { getCurrentWindow } = require('electron').remote;
export default {
    name: 'gp_config',
    props: [ "value", "validateBus", "disabled", "userID" ],
    created() {
        let unsubscribeFromUser = firebase.firestore()
        .collection('users').doc(this.userID)
        .onSnapshot(this.onUserUpdated);
    },
    data() {
        return {
           auth2: null,
           hasGoogleAuth: null,
           launching: false,
           launched: false
        }
    },
    computed: {
        isCheckable() {
           
        }
    },
    methods: {
        async onUserUpdated(userDoc) {
            this.hasGoogleAuth = (userDoc.data().googleAuth != null);
        },
        async launchLogin() {
            let idToken = await firebase.auth().currentUser.getIdToken();
            console.log("ID TOKEN2: ", idToken);
            let qs = querystring.stringify({
                client_id: CLIENT_ID,
                api_url: API_URL,
                id_token: idToken
            });
            //consider passing client id here
            await ipcHelper.invoke('g-auth-open', 'g-auth-opened', `${AUTH_URL}?${qs}`);
        }
    }
};
</script>
 
<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
    @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic');

    .config-div {
        text-align: center;
    }
</style>
 
 