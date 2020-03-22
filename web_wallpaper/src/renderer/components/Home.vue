<template> 
    <div class="fullw">
        <div class="md-layout fullw bg top-bar" :class="`md-alignment-center-space-between`">
            <div class="md-layout-item">
                <span class="md-headline">Hello, {{user.displayName}}</span>
            </div>
            <div class="md-layout-item right-text">
                <md-button 
                v-if="deviceData" 
                class="md-raised dark-button" 
                v-on:click="showDevices()">
                    <md-icon class="button-icon">{{ (deviceData.config.type == PC_DEVICE_TYPE)? PC_ICON: MOBILE_ICON }}</md-icon>
                    {{ deviceData.config.name }}
                </md-button>
                <md-button class="md-raised log-out dark-button" v-on:click="logOut()">Log Out</md-button>
            </div>
        </div>
        <div class="parallax-wrapper fullw">
            <parallax>
                <img src="static/bg.jpg" alt="Your Current Wallpaper"> 
            </parallax>
        </div>
        <div class="fullw">
            <source-cards :userID="user.uid" />
        </div>
        <md-dialog :md-active.sync="devicesOpen">
            <DeviceConfigs :userID="user.uid" @close="hideDevices" />
        </md-dialog>
    </div>
</template>
<script>
const DEFAULT_ASPECT_RATIO_OFF = 30;
const DEFAULT_COLOR = { r: 0, g: 0, b: 0 };
const DEFAULT_COLOR_OFF = 30;
import { THIS_DEVICE_TYPE, PC_DEVICE_TYPE, PC_ICON, MOBILE_ICON } from '../utils/constants'
import { ipcRenderer } from 'electron'
import firebase from 'firebase'
import Parallax from "vue-parallaxy"
import IpcHelper from "../utils/ipcHelper"
import DeviceHelper  from "../utils/deviceHelper";
import DeviceConfigs from "./DeviceConfigs"
import SourceCards from "./SourceCards"

const getDeviceDoc = async (deviceID) => {
    let deviceDoc = await firebase
    .firestore()
    .collection('devices')
    .doc(deviceID)
    .get();
    return deviceDoc;
}

const addDefaultDevice = async (deviceID, userID) => {
    //get device data from main process
    let { width, height } = await IpcHelper.invoke("get-resolution", "resolution");
    let hostname = await IpcHelper.invoke("get-hostname", "hostname");
    let aspectRatio = Math.round((width / height) * 100) / 100;
    let deviceData = {
        userID: userID,
        wallpapers: [],
        sourceImages: {},
        config: {
            name: hostname,
            type: THIS_DEVICE_TYPE,
            minRes: { width, height },
            targetAspectRatio: {
                aspectRatio,
                off: DEFAULT_ASPECT_RATIO_OFF,
                disabled: false
            },
            targetColor: {
                color: DEFAULT_COLOR,
                off: DEFAULT_COLOR_OFF,
                disabled: true
            }
        }
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
    data() {
        return {
            PC_DEVICE_TYPE,
            PC_ICON,
            MOBILE_ICON,
            user: {},
            deviceData: null,
            devicesOpen: false
        }
    },
    async created() { 
        this.user = firebase.auth().currentUser;
        let deviceID = await DeviceHelper.getThisDeviceID(this.user.uid);
        let deviceDoc = await getDeviceDoc(deviceID);
        if (deviceDoc.exists) {
            this.deviceData = deviceDoc.data();
        } else {
            //Add device with default config if new
            this.deviceData = await addDefaultDevice(deviceID, this.user.uid);
        }
    },
    methods: {
        showDevices() {
            this.devicesOpen = true;
        },
        hideDevices() {
            this.devicesOpen = false;
        },
        logOut() { 
            firebase.auth().signOut();
        }  
    },
    components: { Parallax, DeviceConfigs, "source-cards": SourceCards }
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
        width: 100%;
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

    .log-out {
        margin-left: 20px;
        margin-right: 20px;
    }

    .dark-button {
        background: black;
        border: solid #999999 1px;
    }

    .dark-button:hover  {
        background: #0F0F0F;
        border: solid white 1px;
    }

    .top-bar {
        padding-top: 5px;
        padding-bottom: 5px;
    }

    .button-icon {
        margin-right: 2px;
    }
</style>