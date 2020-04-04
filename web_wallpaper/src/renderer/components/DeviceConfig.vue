<template> 
    <div>
        <br />
        <wallpaper-carousel v-if="remoteDevice && remoteDevice.wallpapers" :wallpapers="remoteDevice.wallpapers" />
        <div v-if="localConfig" class="device-div">
            <div class="config-div">
                <div class="md-layout md-alignment-center-space-between">
                    <span class="md-headline md-layout-item">Configurations</span>
                    <div class="md-layout-item save-div">
                        <md-button class="md-icon-button" @click="onSave" :disabled="!isLocalConfigModified">
                            <md-icon>save</md-icon>
                        </md-button>
                        <md-button class="md-icon-button" @click="showRevertDialog = true" :disabled="!isLocalConfigModified">
                            <md-icon>undo</md-icon>
                        </md-button>
                    </div>
                </div>
                <div>
                    <md-field>
                        <label>Name</label>
                        <md-input v-model="localConfig.name"></md-input>
                    </md-field>
                </div>
                <div>
                    <span class="md-title">Minimum Resolution</span>
                    <div class="md-layout md-alignment-center-left">
                        <md-field class="md-layout-item">
                            <label>Width</label>
                            <md-input v-model.number="localConfig.minRes.width"></md-input>
                        </md-field>
                        <p class="md-layout-item md-body-2 res-x">x</p>
                        <md-field class="md-layout-item">
                            <label>Height</label>
                            <md-input v-model.number="localConfig.minRes.height"></md-input>
                        </md-field>
                    </div>
                </div>
                <div>
                    <!--$set used to add new props to data and trigger rerender-->
                    <div class="md-layout md-alignment-center-space-between">
                        <span class="md-title md-layout-item">Crop Limits</span>
                        <md-button 
                        v-if="!localConfig.targetAspectRatio.disabled"
                        @click="$set(localConfig.targetAspectRatio, 'disabled', true)"
                        class="md-primary">
                            Disable
                        </md-button>
                        <md-button 
                        v-else
                        @click="$set(localConfig.targetAspectRatio, 'disabled', false)"
                        class="md-primary">
                            Enable
                        </md-button>
                    </div>
                    <div
                    class="md-layout md-alignment-center-left" 
                    :class="{ disabled: localConfig.targetAspectRatio.disabled }">
                        <md-field class="md-layout-item side-by-side-left">
                            <label>Aspect Ratio</label>
                            <md-input 
                            :disabled="localConfig.targetAspectRatio.disabled" 
                            v-model.number="localConfig.targetAspectRatio.aspectRatio"></md-input>
                        </md-field>
                        <md-field class="md-layout-item side-by-side-right">
                            <label>Allow Aspect Ratios Off By</label>
                            <md-input 
                            :disabled="localConfig.targetAspectRatio.disabled" 
                            v-model.number="localConfig.targetAspectRatio.off"></md-input>
                            <span class="md-suffix">%</span>
                        </md-field>
                    </div>
                </div>
                <!--v-if temporary as all devices should have target color -->
                <div v-if="localConfig.targetColor">
                    <!--$set used to add new props to data and trigger rerender-->
                    <div class="md-layout md-alignment-center-space-between">
                        <span class="md-title md-layout-item">Color</span>
                        <md-button 
                        v-if="!localConfig.targetColor.disabled"
                        @click="$set(localConfig.targetColor, 'disabled', true)"
                        class="md-primary">
                            Disable
                        </md-button>
                        <md-button 
                        v-else
                        @click="$set(localConfig.targetColor, 'disabled', false)"
                        class="md-primary">
                            Enable
                        </md-button>
                    </div>
                    <div
                    class="md-layout md-alignment-center-left" 
                    :class="{ disabled: localConfig.targetColor.disabled }">
                        <color-picker 
                        :color.sync="localConfig.targetColor.color" 
                        :off.sync="localConfig.targetColor.off" 
                        :disabled="localConfig.targetColor.disabled"
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
import { PC_DEVICE_TYPE, MOBILE_ICON, PC_ICON } from '../../constants'
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
            localConfig: null,
            showRevertDialog: false,
            prevIsLocalConfigModified: false
        }
    },
    mounted() {
        if (this.saveBus != null) {
            this.saveBus.$on('save', this.onSave);
        }
    },
    watch: {
        remoteDevice: {
            immediate: true,
            //If remoteDevice is updated, replace local device values that weren't modified
            handler (remoteDevice, prevDevice) {
                if (this.localConfig != null) {
                    _.assignWith(this.localConfig, remoteDevice.config, (localVal, remoteVal, key) => {
                        if (localVal !== prevDevice[key]) {
                            return localVal;
                        } else {
                            return remoteVal;
                        }
                    });
                } else if (remoteDevice) {
                    this.localConfig = firestoreHelper.cloneDeepKeepRefs(remoteDevice.config);
                }
            }
        }
    },
    computed: {
        isLocalConfigModified() {
            let modifiedData = firestoreHelper.getDataDiff(this.localConfig, this.remoteDevice.config);
            console.log("MODIFIED DATA: ", JSON.stringify(modifiedData));
            //only save if data was modified
            let isConfigModified = Object.keys(modifiedData).length > 0;
            if (this.prevIsLocalConfigModified !== isConfigModified) {
                this.prevIsLocalConfigModified = isConfigModified;
                this.$emit('modificationChanged', isConfigModified);
            }
            return isConfigModified;
        }
    },
    beforeDestroy() {
        //assumes created was called
        this.unsubscribeFromDevices();
    },
    methods: {
        setAspectRatioMode(disabled) {
            this.localConfig.targetAspectRatio.disabled = disabled;
            this.$forceUpdate();
        },
        async onSave() {
            let modifiedData = firestoreHelper.getDataDiff(this.localConfig, this.remoteDevice.config);
            if (Object.keys(modifiedData).length > 0) {
                let prevRemoteDevice = this.remoteDevice;
                this.remoteDevice.config = _.cloneDeep(this.localConfig);
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
            this.localConfig = _.cloneDeep(this.remoteDevice.config);
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
        height: 35vh;
        width: 100%;
        padding-right: 18px;
    }

    .save-div {
        max-width: fit-content;
    }
</style>