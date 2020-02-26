<template> 
    <div>
        <md-dialog-title>Devices</md-dialog-title>
        <md-content>
            <md-tabs v-if="devices" class="md-primary" md-alignment="centered" :md-dynamic-height="true" :md-active-tab="activeDeviceID">
                <md-tab 
                v-for="deviceDoc in devices" 
                :id="deviceDoc.id"
                :key="deviceDoc.id" 
                :md-label="deviceDoc.data().name + ((modifiedDeviceIDs[deviceDoc.id])? '*': '')"
                :md-icon="(deviceDoc.data().type == PC_DEVICE_TYPE)? PC_ICON: MOBILE_ICON">
                    <DeviceConfig :deviceID="deviceDoc.id" :userID="userID" :saveBus="saveBus" @modificationChanged="onDeviceModificationChanged(deviceDoc.id, $event)"></DeviceConfig>
                </md-tab>
            </md-tabs>
            <md-progress-spinner v-if="!devices" md-mode="indeterminate"></md-progress-spinner>
        </md-content>
        <md-dialog-actions>
            <md-button class="md-primary" @click="onReqClose">Close</md-button>
            <md-button :disabled="!anyDevicesModified" class="md-primary" @click="onSave">Save All</md-button>
        </md-dialog-actions>
        <md-dialog-confirm
        :md-active.sync="showCloseDialog"
        md-title="Discard Changes?"
        md-content="Changes will be discarded unless you save first"
        md-confirm-text="Don't Save"
        md-cancel-text="Go Back!"
        @md-cancel="showCloseDialog = false"
        @md-confirm="close" />
    </div>
</template>
<script>
import Vue from 'vue'
import { PC_DEVICE_TYPE, MOBILE_ICON, PC_ICON } from '../utils/constants'
import DeviceConfig from './DeviceConfig'
import firestoreHelper from '../utils/firestoreHelper'
import firebase from 'firebase'

export default {
    name: 'device_configs',
    async created() { 
        let userRef = firebase
        .firestore()
        .collection('users')
        .doc(this.userID);
        this.userObserverUnsubscribe = userRef.onSnapshot(
        this.onUserUpdate,
        err => {
            console.log(`Error watching user: ${err}`);
        });
    },
    props: {
        userID: String
    },
    data() {
        return {
            devices: null,
            activeDeviceID: null,
            PC_DEVICE_TYPE,
            MOBILE_ICON,
            PC_ICON,
            modifiedDeviceIDs: {},
            saveBus: new Vue(),
            showCloseDialog: false
        }
    },
    beforeDestroy() {
        if (this.userObserverUnsubscribe != null) {
            this.userObserverUnsubscribe();
        }
    },
    computed: {
        anyDevicesModified() {
            for (let deviceID in this.modifiedDeviceIDs) {
                if (this.modifiedDeviceIDs[deviceID]) {
                    return true;
                }
            }
            return false;
        }
    },
    methods: {
        setDevices(devices) {
            let modifiedDeviceIDs = {};
            for (let device of devices) {
                modifiedDeviceIDs[device.id] = (this.modifiedDeviceIDs[device.id])? true: false;
            }
            this.modifiedDeviceIDs = modifiedDeviceIDs;
            this.devices = devices;
        },
        async onUserUpdate(user) {
            let userData = user.data();
            let deviceSnapshots = await firestoreHelper.getAll(userData.devices);
            //extract data from snapshots
            this.setDevices(deviceSnapshots);
            if (this.devices != null && this.devices.length > 0) {
                for (let device of this.devices) {
                    if (device.id == this.activeDeviceID) {
                        return;
                    }
                }
                //set to first element if no match for activeDeviceID
                this.activeDeviceID = this.devices[0].id;
            }
        },
        onDeviceModificationChanged(deviceID, modified) {
            this.modifiedDeviceIDs[deviceID] = modified;
        },
        onSave() {
            console.log("emitted save");
            this.saveBus.$emit("save");  
        },
        onReqClose() {
            if (this.anyDevicesModified) {
                this.showCloseDialog = true;
            } else {
                this.close();
            }
        },
        close() {
            this.$emit('close');
        }
    },
    components: { DeviceConfig }
};
</script>

<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
    @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic');
</style>