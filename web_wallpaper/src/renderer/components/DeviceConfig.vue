<template> 
    <div>
        <br />
        <div v-if="localDevice" class="device-div">
            <wallpaper-carousel :wallpapers="localDevice.prevWallpapers" />
            <div class="config-div">
                <div class="md-layout md-alignment-center-space-between">
                    <span class="md-headline md-layout-item">Configurations</span>
                    <div class="md-layout-item save-div">
                        <md-button class="md-icon-button" @click="onSave" :disabled="!isLocalDeviceModified">
                            <md-icon>save</md-icon>
                        </md-button>
                        <md-button class="md-icon-button" @click="showRevertDialog = true" :disabled="!isLocalDeviceModified">
                            <md-icon>undo</md-icon>
                        </md-button>
                    </div>
                </div>
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
                        <p class="md-layout-item md-body-2 res-x">x</p>
                        <md-field class="md-layout-item">
                            <label>Height</label>
                            <md-input v-model="localDevice.minRes.height"></md-input>
                        </md-field>
                    </div>
                </div>
                <div>
                    <!--$set used to add new props to data and trigger rerender-->
                    <div class="md-layout md-alignment-center-space-between">
                        <span class="md-title md-layout-item">Crop Limits</span>
                        <md-button 
                        v-if="!localDevice.targetAspectRatio.disabled"
                        @click="$set(localDevice.targetAspectRatio, 'disabled', true)"
                        class="md-primary">
                            Disable
                        </md-button>
                        <md-button 
                        v-else
                        @click="$set(localDevice.targetAspectRatio, 'disabled', false)"
                        class="md-primary">
                            Enable
                        </md-button>
                    </div>
                    <div
                    class="md-layout md-alignment-center-left" 
                    :class="{ disabled: localDevice.targetAspectRatio.disabled }">
                        <md-field class="md-layout-item side-by-side-left">
                            <label>Aspect Ratio</label>
                            <md-input :disabled="localDevice.targetAspectRatio.disabled" v-model="localDevice.targetAspectRatio.aspectRatio"></md-input>
                        </md-field>
                        <md-field class="md-layout-item side-by-side-right">
                            <label>Allow Aspect Ratios Off By</label>
                            <md-input :disabled="localDevice.targetAspectRatio.disabled" v-model="localDevice.targetAspectRatio.off"></md-input>
                            <span class="md-suffix">%</span>
                        </md-field>
                    </div>
                </div>
                <!--v-if temporary as all devices should have target color -->
                <div v-if="localDevice.targetColor">
                    <!--$set used to add new props to data and trigger rerender-->
                    <div class="md-layout md-alignment-center-space-between">
                        <span class="md-title md-layout-item">Color</span>
                        <md-button 
                        v-if="!localDevice.targetColor.disabled"
                        @click="$set(localDevice.targetColor, 'disabled', true)"
                        class="md-primary">
                            Disable
                        </md-button>
                        <md-button 
                        v-else
                        @click="$set(localDevice.targetColor, 'disabled', false)"
                        class="md-primary">
                            Enable
                        </md-button>
                    </div>
                    <div
                    class="md-layout md-alignment-center-left" 
                    :class="{ disabled: localDevice.targetColor.disabled }">
                        <color-picker 
                        :color.sync="localDevice.targetColor.color" 
                        :off.sync="localDevice.targetColor.off" 
                        :disabled="localDevice.targetColor.disabled"
                         />
                    </div>
                </div>
            </div>
        </div>
        <div v-else>
            <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
        </div>
        <md-dialog-confirm
        :md-active.sync="showRevertDialog"
        md-title="Undo all device changes?"
        md-content="Are you sure you want to revert the device config back to the last save?"
        md-confirm-text="Revert Changes"
        md-cancel-text="Nevermind"
        @md-cancel="showRevertDialog = false"
        @md-confirm="onRevert" />
    </div>
</template>
<script>
import { PC_DEVICE_TYPE, MOBILE_ICON, PC_ICON } from '../utils/constants'
import firestoreHelper from '../utils/firestoreHelper'
import firebase from 'firebase'
import _ from 'lodash'
import WallpaperCarousel from './WallpaperCarousel'
import ColorPicker from './ColorPicker'

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
        deviceID:{
            type: String,
            required: true
        },
        userID: String,
        saveBus: Object
    },
    data() {
        return {
            //may need to check for null
            remoteDevice: null,
            localDevice: null,
            showRevertDialog: false,
            prevIsLocalDeviceModified: false
        }
    },
    mounted() {
        if (this.saveBus != null) {
            console.log("linked save");
            this.saveBus.$on('save', this.onSave);
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
    computed: {
        isLocalDeviceModified() {
            let modifiedData = firestoreHelper.getDataDiff(this.localDevice, this.remoteDevice);
            //only save if data was modified
            let isDeviceModified = !_.isEqual(this.localDevice, this.remoteDevice);
            if (this.prevIsLocalDeviceModified !== isDeviceModified) {
                this.prevIsLocalDeviceModified = isDeviceModified;
                this.$emit('modificationChanged', isDeviceModified);
            }
            return isDeviceModified;
        }
    },
    beforeDestroy() {
        //assumes created was called
        this.unsubscribeFromDevices();
    },
    methods: {
        setAspectRatioMode(disabled) {
            this.localDevice.targetAspectRatio.disabled = disabled;
            this.$forceUpdate();
        },
        async onSave() {
            console.log("ON SAVE CALLED");
            let modifiedData = firestoreHelper.getDataDiff(this.localDevice, this.remoteDevice);
            if (Object.keys(modifiedData).length > 0) {
                console.log("KEY PASSED");
                let prevRemoteDevice = this.remoteDevice;
                this.remoteDevice = _.cloneDeep(this.localDevice);
                try {
                    await firebase
                    .firestore()
                    .collection('devices').doc(this.deviceID)
                    .set(modifiedData, { merge: true });
                } catch (e) {
                    console.warn("Could not set device: ", this.deviceID, e);
                    this.remoteDevice = prevRemoteDevice;
                }
            }
        },
        onRevert() {
            this.localDevice = _.cloneDeep(this.remoteDevice);
        }
    },
    components: { 'wallpaper-carousel': WallpaperCarousel, 'color-picker': ColorPicker }
};
</script>

<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
    @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic');

    .disabled {
        background: #111111;
    }

    .side-by-side-left {
        margin-right: 5px;
    }

    .side-by-side-right {
        margin-left: 5px;
    }

    .res-x {
        margin-right: 5px;
        margin-left: 5px;
        max-width: fit-content;
    }

    .config-div {
        max-width: 550px;
    }

    .device-div {
        overflow-y: scroll;
        height: 45vh;
        width: 100%;
        padding-right: 18px;
    }

    .save-div {
        max-width: fit-content;
    }
</style>