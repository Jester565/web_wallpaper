<template>
  <div>
    <parallax fixed="true">
      <img src="static/bg.jpg" alt="hello"> 
    </parallax>
    <div class="back">
      <br />
      <div class="md-layout fullw" :class="`md-alignment-top-space-around`">
        <div class="md-layout-item md-size-50 center-text">
          <span class="md-display-4">web_wall</span>
        </div>
      </div>
      <br />
      <br />
      <div class="md-layout fullw" :class="`md-alignment-top-space-around`">
        <div class="md-layout-item md-size-20 main-back">
          <div id="firebaseui-auth-container"></div>
        </div>
      </div>
    </div>
    <div class="about-wrapper">
      <div class="md-layout fullw" :class="`md-alignment-top-space-around`">
        <div class="md-layout-item md-size-50 center-text">
          <span class="md-display-1 about">About</span>  
        </div>
      </div>
      <div class="about-desc">
        <div class="md-layout fullw" :class="`md-alignment-top-space-around`">
          <div class="md-layout-item md-size-50 center-text">
            <span class="md-headline">Change your wallpaper every day to pictures from these sources</span>  
          </div>
        </div>
        <br />
        <md-tabs class="md-primary" md-alignment="centered" md-dynamic-height="true">
          <md-tab id="tab-home" md-icon="static/reddit.svg" md-dynamic-height="true">
            <RedditDesc />
          </md-tab>
          <md-tab id="tab-a" md-icon="static/gp.svg">
            <GoogPhotosDesc />
          </md-tab>
        </md-tabs>
        <br />
        <div class="md-layout fullw" :class="`md-alignment-top-space-around`">
          <div class="md-layout-item md-size-50 center-text">
            <span class="md-headline">Filter Out</span>  
          </div>
        </div>
        <br />
        <br />
        <div class="md-layout fullw" :class="`md-alignment-top-space-around`">
          <div class="md-layout-item md-size-25 img-container">
            <img class="filter-img" src="static/faces.jpg">
            <span class="md-headline pic-center">Faces</span>
          </div>
          <div class="md-layout-item md-size-25 img-container">
            <img class="filter-img" src="static/txt.jpg">
            <span class="md-headline pic-center">Text</span>
          </div>
          <div class="md-layout-item md-size-25 img-container">
            <img class="filter-img" src="static/dom_colors.png">
            <span class="md-headline pic-center">Colors</span>
          </div>
        </div>
        <br />
      </div>
    </div>
  </div>
</template>
<script>
import RedditDesc from './RedditDesc';
import GoogPhotosDesc from './GoogPhotosDesc';
import Parallax from "vue-parallaxy";
import firebase from 'firebase';
import firebaseui from 'firebaseui'
import {config} from '../config/firebaseConfig'
export default {
  name: 'landing_page',
  mounted() {
    var uiConfig = {
      signInSuccessUrl: '/home',
      signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID
        ]
      };
    const orig = firebase.INTERNAL.node;
    delete firebase.INTERNAL.node;
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    ui.start('#firebaseui-auth-container', uiConfig);
  },
  components: {
    Parallax, RedditDesc, GoogPhotosDesc
  }
}
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

  .center-text {
    text-align: center;
  }

  .about-wrapper {
    position: absolute;
    top: 85vh;
    left: 0;
    width: 100vw;
  }

  .about {
    border-top-right-radius: 10px;
    border-top-left-radius: 10px;
    background: #303030;
    padding-top: 2px;
    padding-right: 5px;
    padding-left: 5px;
    padding-bottom: 2px;
  }

  .about-desc {
    background: #303030;
    padding-right: 5px;
    padding-left: 5px;
    text-align: center;
  }

  .halfw {
    width: 50vw;
  }

  svg {
    width: 43px !important;
    height: 43px !important;
    position: absolute !important;
    left: 15px !important;
    top: 2px !important;
  }

  .filter-img {
    border: solid #000;
    border-width: 1 3px;
    border-radius: 6px;
  }

  .pic-center {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translate(-50%, -50%);
    padding-left: 3px;
    padding-right: 3px;
    padding-top: 2px;
    padding-bottom: 2px;
    border-radius: 4px;
    background: #303030;
  }

  .al-left {
    text-align: left !important;
  }

  .al-center {
    text-align: center !important;
  }
</style>
