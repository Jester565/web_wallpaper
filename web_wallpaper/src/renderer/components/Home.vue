<template> 
    <div class="fullw">
        <div class="md-layout fullw bg" :class="`md-alignment-center-space-around`">
            <div class="md-layout-item md-size-60">
                <span class="md-headline">Hello, {{user.displayName}}</span>
            </div>
            <div class="md-layout-item md-size-25 right-text">
                <md-button class="md-primary md-raised" v-on:click="logOut()">Log Out</md-button>
            </div>
        </div>
        <div class="parallax-wrapper fullw">
            <parallax>
                <img src="static/bg.jpg" alt="Your Current Wallpaper"> 
            </parallax>
        </div>
    </div>
</template>
<script>
const DEFAULT_ASPECT_RATIO_OFF = 0.5

import { ipcRenderer } from 'electron'
import firebase from 'firebase'
import Parallax from "vue-parallaxy"
import IpcHelper from "../utils/ipcHelper"

const getDeviceID = async (userID) => {
    let machineID = await IpcHelper.invoke("get-machine-id", "machine-id");
    //Append userID to machineID so that multiple users can use same device
    let deviceID = userID + machineID;
    return deviceID;
}

const getDeviceDoc = async (deviceID) => {
    try {
        let deviceDoc = await firebase
        .firestore()
        .collection('devices')
        .doc(deviceID)
        .get();
        return deviceDoc;
    } catch (ex) {
        console.log(ex);
        return null;
    }
}

const addDefaultDevice = async (deviceID, userID) => {
    let { width, height } = await IpcHelper.invoke("get-resolution", "resolution");
    let hostname = await IpcHelper.invoke("get-hostname", "hostname");
    let aspectRatio = width / height;
    let deviceData = {
        userID: userID,
        minRes: { width, height },
        name: hostname,
        prevWallpapers: [],
        targetAspectRatio: {
            aspectRatio,
            off: DEFAULT_ASPECT_RATIO_OFF
        },
        targetColor: null
    };

    await firebase
    .firestore()
    .collection('devices')
    .doc(deviceID)
    .set(deviceData);
    return deviceData;
}

export default {
    name: 'home',
    data(){
        return {
            user: {},
            deviceData: null
        }
    },
    async created() { 
        this.user = firebase.auth().currentUser;
        console.log("USER: ", this.user);
        let deviceID = await getDeviceID(this.user.uid);
        let deviceDoc = await getDeviceDoc(deviceID);
        if (deviceDoc && deviceDoc.exists) {
            this.deviceData = deviceDoc.data();
        } else {
            //Add device with default config if new
            this.deviceData = await addDefaultDevice(deviceID, this.user.uid);
        }
    },
    methods: { 
        logOut() { 
            firebase.auth().signOut();
        }  
    },
    components: { Parallax }
};
</script>

<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
    @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic');

    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    .fullw {
        width: 100%;
    }

    .right-text {
        text-align: right;
    }

    .bg {
        background: #303030;
    }

    .full {
        width: 100%;
        height: 100%;
    }

    .img-container {
        position: relative;
        text-align: center;
        color: white;
    }

    .back {
        position: absolute;
        left: 0;
        top: 0;
        width: 100vw;
        height: 100vh;
        background: transparent !important;
    }

    .main-back {
        background: #3333333b;
        border-radius: 20px;
    }

    .parallax-wrapper {
        position: relative;
    }
</style>