<template> 
    <div class="md-layout md-alignment-center-left">
        <md-button
        v-for="n in maxRating"
        :key="n"
        :disabled="disabled"
        @click="onRating(n)"
        @mouseover="onEnterHover(n)"
        @mouseleave="onLeaveHover(n)">
            <md-icon :class="{ 'contains-rating': (n <= value), 'contains-hover': (hoverRating != null && n <= hoverRating) }">favorite</md-icon>
        </md-button>
    </div>  
</template>
<script>
const MAX_RATING = 5;
 
export default {
    name: 'like_rater',
    props: [ "value", "disabled" ],
    data() {
        return {
            maxRating: MAX_RATING,
            hoverRating: null
        }
    },
    methods: {
        onRating(rating) {
            this.$emit("input", rating);
        },
        onEnterHover(rating) {
            this.hoverRating = rating;
        },
        onLeaveHover(rating) {
            //Avoid overwriting another hover if onEnterHover is triggered first (not sure if necessary)
            if (this.hoverRating === rating) {
                this.hoverRating = null;
            }
        }
    }
};
</script>
 
<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
    @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic');

    .contains-rating {
        color: #C00 !important;
    }

    .contains-hover {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 5px;
    }
</style>
 
 