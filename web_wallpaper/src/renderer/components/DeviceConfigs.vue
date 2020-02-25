<template> 
    <div>
        <md-dialog-title>Devices</md-dialog-title>
        <md-content>
            <md-tabs v-if="devices" class="md-primary" md-alignment="centered" :md-dynamic-height="true" :md-active-tab="activeDeviceID">
                <md-tab 
                v-for="deviceDoc in devices" 
                :id="deviceDoc.id"
                :key="deviceDoc.id" 
                :md-label="deviceDoc.data().name"
                :md-icon="(deviceDoc.data().type == PC_DEVICE_TYPE)? PC_ICON: MOBILE_ICON">
                    <DeviceConfig :deviceID="deviceDoc.id" :userID="userID"></DeviceConfig>
                </md-tab>
            </md-tabs>
            <md-progress-spinner v-if="!devices" md-mode="indeterminate"></md-progress-spinner>
        </md-content>
        <md-dialog-actions>
            <md-button class="md-primary" @click="close()">Close</md-button>
            <md-button :disabled="!devices" class="md-primary" @click="save()">Save</md-button>
        </md-dialog-actions>
    </div>
</template>
<script>
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
            PC_ICON
        }
    },
    beforeDestroy() {
        console.log("BeforeDestroy invoked on deviceConfigs");
        if (this.userObserverUnsubscribe != null) {
            console.log("Unsubscribe invoked on user");
            this.userObserverUnsubscribe();
        }
    },
    methods: {
        async onUserUpdate(user) {
            let userData = user.data();
            let deviceSnapshots = await firestoreHelper.getAll(userData.devices);
            //extract data from snapshots
            this.devices = deviceSnapshots;
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