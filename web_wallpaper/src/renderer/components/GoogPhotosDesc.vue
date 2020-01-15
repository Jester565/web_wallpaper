<template> 
    <div class="md-layout fullw" :class="`md-alignment-top-space-around`">
        <div class="md-layout-item md-size-25 al-left">
            <div class="al-center">
                <span class="md-headline" v-bind:style="{ 'text-decoration': 'underline' }">Google Photos</span>
            </div>
            <br />
            <span class="md-subheading">Determine what images to check by specifying</span> 
            <md-list>
                <md-list-item>
                <md-icon>photo_album</md-icon>
                <span class="md-list-item-text">Albums</span>
                </md-list-item>
                <md-list-item>
                <md-icon>person</md-icon>
                <span class="md-list-item-text">People</span>
                </md-list-item>
                <md-list-item>
                <md-icon>alarm</md-icon>
                <span class="md-list-item-text">Time Spans</span>
                </md-list-item>
            </md-list>
        </div>
        <div class="md-layout-item md-size-50 center-text">
            <img src="static/gphotos.png">
        </div>
    </div>
</template>
<script>
export default {
    name: 'goog_photos_desc'
};
</script>