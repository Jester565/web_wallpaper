<template> 
    <div class="md-layout fullw" :class="`md-alignment-top-space-around`">
        <div class="md-layout-item md-size-20">
            <div id="firebaseui-auth-container"></div>
        </div>
    </div>
</template>
<script>
import firebase from 'firebase';
import firebaseui from 'firebaseui';
import axios from 'axios';
import _ from 'lodash';
import router from 'vue-router';
const {getCurrentWindow} = require('electron').remote;
export default {
    name: 'gp_config',
    props: [ "value", "validateBus", "disabled" ],
    mounted() {
        this.linkWithGoogle();
    },
    data() {
        return {
           
        }
    },
    computed: {
        isCheckable() {
           
        }
    },
    methods: {
        async linkWithGoogle() {
            let googleProviderID = firebase.auth.GoogleAuthProvider.PROVIDER_ID;
            let prevUser = firebase.auth().currentUser;
            let uiConfig = {
            signInOptions: [{
                provider: googleProviderID,
                scopes: [ 'https://www.googleapis.com/auth/photoslibrary.readonly' ]
            }],
            signInFlow: 'popup',
            callbacks: {
                signInSuccessWithAuthResult: (authResult, redirectUrl) => {
                    let run = async () => {
                        try {
                            if (prevUser.uid != firebase.auth().currentUser.uid) {
                                await firebase.auth().currentUser.delete();
                                let linkResult = await prevUser.linkWithCredential(authResult.credential);
                                try {
                                    await firebase.auth().signInWithCredential(linkResult.credential);
                                    this.$router.push('/');
                                    getCurrentWindow().reload();
                                } catch (err) {
                                    console.log("LINK SIGN IN ERR: ", err.message);
                                }
                            }
                        } catch (err) {
                            console.log("LINK ERR: ", err.message);
                        }
                    }
                    run();
                    return false;
                },
                signInFailure: (error) => {
                    console.log("SIGN IN ERR: ", error);
                    if (error.code != 'firebaseui/anonymous-upgrade-merge-conflict') {
                        return Promise.resolve();
                    }
                    return false;
                }
            }};
            const orig = firebase.INTERNAL.node;
            delete firebase.INTERNAL.node;
            firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            let ui = new firebaseui.auth.AuthUI(firebase.auth());
            ui.start('#firebaseui-auth-container', uiConfig);
        }
    }
};
</script>
 
<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
    @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic');
</style>
 
 