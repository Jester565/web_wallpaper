<template> 
    <div>
        <md-dialog-title>Devices</md-dialog-title>
        <md-content>
            <md-tabs class="md-primary" md-alignment="centered" :md-dynamic-height="true">
                <md-tab 
                v-for="deviceDoc in devices" 
                :key="deviceDoc.id" 
                :md-label="deviceDoc.name"
                :md-icon="(deviceDoc.type == PC_DEVICE_TYPE)? PC_ICON: MOBILE_ICON">
                    <p>Device</p>
                </md-tab>
            </md-tabs>
        </md-content>
        <md-dialog-actions>
            <md-button class="md-primary" @click="close()">Close</md-button>
            <md-button class="md-primary" @click="save()">Save</md-button>
        </md-dialog-actions>
    </div>
</template>
<script>
import { PC_DEVICE_TYPE, MOBILE_ICON, PC_ICON } from '../utils/constants'
import firestoreHelper from '../utils/firestoreHelper'
import firebase from 'firebase'

export default {
    name: 'device_config',
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
            this.devices = deviceSnapshots.map(snapshot => snapshot.data());
        },
        close() {
            this.$emit('close');
        }
    }
};
</script>

<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
    @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic');
</style>