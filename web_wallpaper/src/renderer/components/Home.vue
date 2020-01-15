<template> 
    <div>
        <div class="md-layout fullw bg" :class="`md-alignment-center-space-around`">
            <div class="md-layout-item md-size-60">
                <span class="md-headline">Hello, {{user.displayName}}</span>
            </div>
            <div class="md-layout-item md-size-25 right-text">
                <md-button class="md-primary md-raised" v-on:click="logOut()">Log Out</md-button>
            </div>
        </div>
        <div class="parallax-wrapper">
            <parallax fixed="true">
                <img src="static/bg.jpg" alt="hello"> 
            </parallax>
            <div class="back">
                <br />
                <div class="md-layout fullw" :class="`md-alignment-top-space-around`">
                    <div class="md-layout-item md-size-50 center-text">
                        <span class="md-display-1">Today's Wallpaper</span>
                    </div>
                </div>
                <div class="md-layout full" :class="`md-alignment-center-space-around`">
                    <div class="md-layout-item md-size-50 main-back center-text">
                        <span class="md-display-2">r/wallpapers</span>
                    </div>
                </div>
            </div>
        </div>
        <ImgSourceRow />
    </div>
</template>
<script>
import ImgSource from './ImgSourceRow'
import firebase from 'firebase'
import Parallax from "vue-parallaxy"
export default {
    name: 'home',
    data(){
        return {
            user: {}
        }
    },
    created() { 
        this.user = firebase.auth().currentUser;
        console.log("USER: ", this.user);
    },
    methods: { 
        logOut() { 
            firebase.auth().signOut();
        }  
    },
    components: { Parallax, ImgSource }
};
</script>

<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
    @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic');

    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    .fullw {
        width: 100%;
    }

    .right-text {
        text-align: right;
    }

    .bg {
        background: #303030;
    }

    .full {
        width: 100%;
        height: 100%;
    }

    .img-container {
        position: relative;
        text-align: center;
        color: white;
    }

    .back {
        position: absolute;
        left: 0;
        top: 0;
        width: 100vw;
        height: 100vh;
        background: transparent !important;
    }

    .main-back {
        background: #3333333b;
        border-radius: 20px;
    }

    .parallax-wrapper {
        position: relative;
    }
</style>