<template> 
    <div class="md-layout fullw" :class="`md-alignment-top-space-around`">
        <div class="md-layout-item md-size-25 al-left">
            <div class="al-center">
                <span class="md-headline" v-bind:style="{ 'text-decoration': 'underline' }">Reddit</span>
            </div>
            <br />
            <span class="md-subheading">Determine what images to check by specifying</span> 
            <md-list>
                <md-list-item>
                    <md-icon md-src="static/subred.svg"></md-icon>
                    <span class="md-list-item-text">Subreddits</span>
                </md-list-item>
                <md-list-item>
                    <md-icon md-src="static/upvote.svg"></md-icon>
                    <span class="md-list-item-text"># of Upvotes</span>
                </md-list-item>
                <md-list-item>
                    <md-icon>alarm</md-icon>
                    <span class="md-list-item-text">Time Span</span>
                </md-list-item>
            </md-list>
            <span class="md-subheading al-left">Figure out how to prioritize these images with</span> 
            <md-list>
                <md-list-item>
                    <md-icon>people_alt</md-icon>
                    <span class="md-list-item-text">Top</span>
                </md-list-item>
                <md-list-item>
                    <md-icon>fireplace</md-icon>
                    <span class="md-list-item-text">Hot</span>
                </md-list-item>
                <md-list-item>
                    <md-icon>new_releases</md-icon>
                    <span class="md-list-item-text">New</span>
                </md-list-item>
                <md-list-item>
                    <md-icon>expand_less</md-icon>
                    <span class="md-list-item-text">Rising</span>
                </md-list-item>
                <md-list-item>
                    <md-icon>shuffle</md-icon>
                    <span class="md-list-item-text">Random</span>
                </md-list-item>
            </md-list>
        </div>
        <div class="md-layout-item md-size-50 center-text">
            <img src="static/reddit_thread.jpg">
        </div>
    </div>
</template>
<script>
export default {
    name: 'reddit_desc'
};
</script>