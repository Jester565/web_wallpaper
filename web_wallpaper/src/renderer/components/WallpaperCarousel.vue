<template>
    <div>
        <div v-if="carouselItems != null && carouselItems.length > 0">
            <mdb-carousel :items="carouselItems" v-model="itemI" indicators></mdb-carousel>
            <div class="md-layout md-alignment-center-center">
                <md-button md-raised
                @click="setWallpaper">
                    Set As Wallpaper
                </md-button>
            </div>
            <md-button 
            v-if="canAdd"
            md-raised
            md-primary
            :disabled="adding"
            @click="$emit('onAdd')">
                <md-progress-spinner v-if="adding" md-mode="indeterminate"></md-progress-spinner>
                Find A New Wallpaper
            </md-button>
        </div>
        <div v-else-if="carouselItems != null">
            <md-empty-state
            md-icon="add_photo_alternate"
            :md-label="(emptyTitle)? emptyTitle: `No Images Yet, Let's Add Some`"
            :md-description="(emptyDescription)? emptyDescription: `Creating project, you'll be able to upload your design and collaborate with people`">
                <md-button 
                v-if="canAdd" 
                :disabled="adding"
                @click="$emit('onAdd')"
                class="md-primary md-raised">
                    <md-progress-spinner v-if="adding" md-mode="indeterminate"></md-progress-spinner>
                    Find A Wallpaper
                </md-button>
            </md-empty-state>
        </div>
        <div v-else>
            <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
        </div>
    </div>
</template>
<script>
import firebase from 'firebase'
import firestoreHelper from '../utils/firestoreHelper'
import ipcHelper from '../utils/ipcHelper'
import { mdbCarousel } from 'mdbvue'

export default {
    name: 'wallpaper_carousel',
    async created() {
        this.wallpaperIdSubToken = ipcHelper.subscribe('wallpaper-id', (__, wallpaperID) => {
            this.activeWallpaperID = wallpaperID;
        });
        this.activeWallpaperID = await ipcHelper.invoke('get-wallpaper-id', 'resp-wallpaper-id');
    },
    props: {
        wallpapers: Array,
        emptyTitle: String,
        emptyDescription: String,
        canAdd: false,
        adding: false
    },
    data() {
        return {
           imageDocs: null,
           carouselItems: null,
           itemI: 0,
           activeWallpaperID: null,
           settingWallpaper: null
        }
    },
    beforeDestroy() {
        if (this.wallpaperIdSubToken) {
            ipcHelper.unsubscribe(this.wallpaperIdSubToken);
        }
    },
    methods: {
        async setWallpaper() {
            this.settingWallpaper = true;
            let imgDoc = this.imageDocs[this.itemI];
            let wallpaperID = await ipcHelper.invoke('set-wallpaper', 'resp-set-wallpaper', { id: imgDoc.id, url: imgDoc.data().url });
            if (wallpaperID == null) {
                console.log("Wallpaper setting failed");
            }
            this.settingWallpaper = false;
        }
    },
    watch: {
        wallpapers: {
            async handler(imageRefs) {
                if (imageRefs != null) {
                    let imageDocs = await firestoreHelper.getAll(imageRefs);
                    let carouselItems = [];
                    for (let imgDoc of imageDocs) {
                        carouselItems.push({
                            img: true,
                            src: imgDoc.data().url,
                            mask: "black-light",
                            caption: {
                                title: imgDoc.data().title
                            }
                        })
                    }
                    this.imageDocs = imageDocs;
                    this.carouselItems = carouselItems;
                }
            },
            immediate: true
        }
    },
    components: {
        'mdb-carousel': mdbCarousel
    },
};
</script>

<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
    @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic');
</style>