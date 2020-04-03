<template>
    <div>
        <div v-if="imageDocs != null && imageDocs.length > 0">
            <vueper-slides
            :bullets="false"
            :lazy="true"
            :slideRatio="0.5"
            :infinite="false"
            @slide="onSlide"
            disable-arrows-on-edges>
                <vueper-slide v-for="(imgDoc, i) in imageDocs" :key="i" :image="imgDoc.data().url">
                    <template v-slot:content>
                        <div class="md-layout md-alignment-center-right">
                            <span class="md-headline img-title">{{imgDoc.data().name}}</span>
                        </div>
                    </template>
                </vueper-slide>
            </vueper-slides>
            <div class="md-layout md-alignment-center-space-around">
                <md-button
                class="md-layout-item md-raised md-primary"
                :disabled="settingWallpaper"
                @click="setWallpaper">
                    Set As Wallpaper
                </md-button>
                <md-button 
                v-if="canAdd"
                class="md-layout-item md-raised md-accent"
                :disabled="adding"
                @click="$emit('onAdd')">
                    <md-progress-spinner v-if="adding" md-mode="indeterminate"></md-progress-spinner>
                    Find A New Wallpaper
                </md-button>
            </div>
        </div>
        <div v-else-if="imageDocs != null">
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
import wallpaperHelper from '../utils/wallpaperHelper'
import ipcHelper from '../utils/ipcHelper'
import { VueperSlides, VueperSlide } from 'vueperslides'
import 'vueperslides/dist/vueperslides.css'

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
            let wallpaperID = await wallpaperHelper.setWallpaper(imgDoc);
            if (wallpaperID == null) {
                console.log("Wallpaper setting failed");
            }
            this.settingWallpaper = false;
        },
        onAdd() {
            this.$emit('onAdd');
        },
        onSlide(evt) {
            this.itemI = evt.currentSlide.index;
        },
    },
    watch: {
        wallpapers: {
            async handler(imageRefs) {
                if (imageRefs != null) {
                    this.imageDocs = await firestoreHelper.getAll(imageRefs);
                }
            },
            immediate: true
        }
    },
    components: {
        'vueper-slides': VueperSlides,
        'vueper-slide': VueperSlide
    }
};
</script>

<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
    @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic');

    .img-title {
        max-width: 75%;
        background: rgba(0, 0, 0, 0.8);
        white-space:nowrap;
        overflow:hidden;
        padding-left: 4px;
        padding-bottom: 2px;
        padding-top: 1px;
        border-bottom-left-radius: 3px;
        border: rgba(0, 0, 0, 0.9) solid 1px;
    }
</style>