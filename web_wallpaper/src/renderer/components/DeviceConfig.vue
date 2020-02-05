<template> 
    <div>
        <br />
        <div v-if="localDevice">
            <WallpaperCarousel :wallpapers="localDevice.prevWallpapers" />
            <span class="md-headline">Configurations</span>
            <div>
                <md-field>
                    <label>Name</label>
                    <md-input v-model="localDevice.name"></md-input>
                </md-field>
            </div>
            <div>
                <span class="md-title">Minimum Resolution</span>
                <div class="md-layout md-alignment-center-left">
                    <md-field class="md-layout-item">
                        <label>Width</label>
                        <md-input v-model="localDevice.minRes.width"></md-input>
                    </md-field>
                    <p class="md-layout-item md-body-2">x</p>
                    <md-field class="md-layout-item">
                        <label>Height</label>
                        <md-input v-model="localDevice.minRes.height"></md-input>
                    </md-field>
                </div>
            </div>
            <div>
                <div class="md-layout md-alignment-center-space-between">
                    <span class="md-title md-layout-item">Crop Limits</span>
                    <md-button 
                    v-if="!localDevice.targetAspectRatio.disabled" 
                    @click="localDevice.targetAspectRatio = true"
                    class="md-primary">
                        Disable
                    </md-button>
                    <md-button 
                    v-else
                    @click="localDevice.targetAspectRatio.disabled = false"
                    class="md-primary">
                        Enable
                    </md-button>
                </div>
                <div class="md-layout md-alignment-center-left" :class="{ disabled: localDevice.targetAspectRatio.disabled }">
                    <md-field class="md-layout-item">
                        <label>Aspect Ratio</label>
                        <md-input :disabled="localDevice.targetAspectRatio.disabled" v-model="localDevice.targetAspectRatio.aspectRatio"></md-input>
                    </md-field>
                    <md-field class="md-layout-item">
                        <label>Allow Aspect Ratios Off By</label>
                        <md-input :disabled="localDevice.targetAspectRatio.disabled" v-model="localDevice.targetAspectRatio.off"></md-input>
                        <span class="md-suffix">%</span>
                    </md-field>
                </div>
            </div>
        </div>
        <div v-else>
            <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
        </div>
    </div>
</template>
<script>
import { PC_DEVICE_TYPE, MOBILE_ICON, PC_ICON } from '../utils/constants'
import firestoreHelper from '../utils/firestoreHelper'
import firebase from 'firebase'
import _ from 'lodash'
import WallpaperCarousel from './WallpaperCarousel'

export default {
    name: 'device_config',
    created() { 
        this.unsubscribeFromDevices = firebase
        .firestore()
        .collection('devices').doc(this.deviceID)
        .onSnapshot((snapshot) => {
            this.remoteDevice = snapshot.data();
        });
    },
    props: {
        deviceID: String,
        userID: String
    },
    data() {
        return {
            //may need to check for null
            remoteDevice: null,
            localDevice: null
        }
    },
    watch: {
        remoteDevice: {
            immediate: true,
            //If remoteDevice is updated, replace local device values that weren't modified
            handler (remoteDevice, prevDevice) {
                if (this.localDevice != null) {
                    _.assignWith(this.localDevice, remoteDevice, (localVal, remoteVal, key) => {
                        if (localVal !== prevDevice[key]) {
                            return localVal;
                        } else {
                            return remoteVal;
                        }
                    });
                } else {
                    this.localDevice = _.cloneDeep(remoteDevice);
                }
            }
        }
    },
    beforeDestroy() {
        //assumes created was called
        this.unsubscribeFromDevices();
    },
    methods: {

    },
    components: [ WallpaperCarousel ]
};
</script>

<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
    @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic');

    .disabled {
        background: #444444;
    }
</style>