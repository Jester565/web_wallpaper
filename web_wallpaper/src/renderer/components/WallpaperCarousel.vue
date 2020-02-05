<template> 
    <div class="temp">
        
    </div>
</template>
<script>
import firebase from 'firebase'

export default {
    name: 'wallpaper_carousel',
    async created() { 
        
    },
    props: {
        wallpapers: Array
    },
    data() {
        return {
           
        }
    },
    beforeDestroy() {
        
    },
    methods: {
        
    }
};
</script>

<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
    @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic');

    .temp {
        height: 500px;
        width: 100%;
    }
</style>