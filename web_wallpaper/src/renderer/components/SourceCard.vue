<template> 
    <div>
        <md-card class="md-elevation-14 source-card" @click.native="configOpen = true">
            <md-card-media-cover md-solid>
                <md-card-media md-ratio="4:3">
                    <div v-if="thumbnail">
                        <img class="source-img" :src="thumbnail.url" alt="Sources">
                    </div>
                    <div v-else-if="device && thumbnailID == null">
                        <img class="source-img" src="/static/new_source.webp" alt="Sources">
                    </div>
                    <div v-else>
                        <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
                    </div>
                </md-card-media>
                <md-card-area>
                    <md-card-header>
                        <div class="md-layout md-alignment-center-left">
                            <md-icon 
                            v-if="sourceTypeConsts != null"
                            class="md-layout-item md-size-3x" 
                            :md-src="sourceTypeConsts.icon" />
                            <span class="md-layout-item md-title">{{source.name}}</span>
                        </div>
                    </md-card-header>
                </md-card-area>
            </md-card-media-cover>
        </md-card>
        <md-dialog :md-active.sync="configOpen">
            <md-dialog-title>{{source.name}}</md-dialog-title>
            <wallpaper-carousel 
            :wallpapers="(device && device.sourceImages)? ((device.sourceImages[sourceID])? device.sourceImages[sourceID]: []): null"
            :canAdd="true"
            :adding="addingImage"
            @onAdd="onAddImage()" />
            <source-config 
            class="source-config"
            :value="source"
            :userID="userID" 
            :sourceID="sourceID"
            :deviceID="deviceID" 
            :saveBus="saveBus"
            @onModificationChanged="sourceModified = $event"
            @canSaveChanged="canSave = $event"
            @onSaved="configOpen = false" />
            <md-dialog-actions>
                <md-button class="md-primary md-raised"
                :disabled="!canSave" 
                @click="onSave">Save</md-button>
                <md-button class="md-secondary" @click="onConfigClose">Close</md-button>
            </md-dialog-actions>
            <md-dialog-confirm
            :md-active.sync="showCloseDialog"
            md-title="Discard Changes to Source?"
            md-content="Your source won't be modified"
            md-confirm-text="Don't Save"
            md-cancel-text="Go Back!"
            @md-cancel="showCloseDialog = false"
            @md-confirm="configOpen = false" />
        </md-dialog>
    </div>
</template>
<script>
import Vue from 'vue'
import { Consts as SourceTypeConsts } from './SourceTypeConfigs/index'
import { API_URL } from '../../constants'
import firebase from 'firebase'
import WallpaperCarousel from './WallpaperCarousel'
import SourceConfig from './SourceConfig'
import DeviceHelper from '../utils/deviceHelper'
import Axios from 'axios'
 
export default {
    name: 'source_card',
    async created() { 
        await this.setDeviceID();
        this.subscribeToDevice();
    },
    props: {
        userID: {
            type: String,
            required: true
        },
        sourceID: {
            type: String,
            required: true
        },
        source: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            deviceID: null,
            device: null,
            configOpen: false,
            showCloseDialog: false,
            sourceModified: false,
            canSave: false,
            saveBus: new Vue(),
            addingImage: false,
            thumbnailID: null,
            thumbnail: null
        }
    },
    computed: {
        wallpapers() {
            return (this.source != null && this.source.deviceImages && this.deviceID)? this.source.deviceImages[this.deviceID]: null;
        },
        sourceTypeConsts() {
            return (this.source != null)? SourceTypeConsts[this.source.type]: null
        }
    },
    beforeDestory() {
        if (this.unsubscribeFromDevice) {
            this.unsubscribeFromDevice();
        }
    },
    methods: {
        async setDeviceID() {
            this.deviceID = await DeviceHelper.getThisDeviceID(this.userID);
        },
        subscribeToDevice() {
             this.unsubscribeFromDevice = firebase
            .firestore()
            .collection('devices').doc(this.deviceID)
            .onSnapshot(async (snapshot) => {
                this.device = snapshot.data();
                if (this.device.sourceImages) {
                    let images = this.device.sourceImages[this.sourceID];
                    if (images && images.length > 0) {
                        if (this.thumbnailID != images[0].id) {
                            this.thumbnailID = images[0].id;
                            let thumbnailDoc = await images[0].get();
                            this.thumbnail = thumbnailDoc.data();
                        }
                    }
                }
            });
        },
        onSave() {
            this.saveBus.$emit("save");  
        },
        onConfigClose() {
            if (this.sourceModified) {
                this.showCloseDialog = true;
            } else {
                this.configOpen = false;
            }
        },
        async onAddImage() {
            let idToken = await firebase.auth().currentUser.getIdToken();
            //Add one image for this source
            this.addingImage = true;
            await Axios.post(`${API_URL}/addSourceImages`, {
                deviceIDs: [this.deviceID],
                sourceID: this.sourceID
            }, {
                headers: {
                    authorization: `Bearer ${idToken}`
                }
            });
            this.addingImage = false;
        }
    },
    components: { 'source-config': SourceConfig, 'wallpaper-carousel': WallpaperCarousel }
};
</script>
 
<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
    @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic');

    .source-card {
        border: solid black 2px;
    }

    .source-card:hover {
        background: #111;
        border: solid white 4px;
    }

    .source-img {
        width: 100%;
        object-fit: contain;
    }

    .source-config {
        margin: 10px;
    }
</style>

