<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
  import { Titlebar, Color } from 'custom-electron-titlebar'
  let titleBar = new Titlebar({
      backgroundColor: Color.fromHex('#111111'),
      shadow: true,
      icon: '~@/assets/icon.png'
  });

  // 3. Update Titlebar text
  titleBar.updateTitle('WebWall');

  import Vue from 'vue'
  import VueMaterial from 'vue-material'
  import 'vue-material/dist/vue-material.min.css'
  import 'vue-material/dist/theme/default-dark.css'

  Vue.use(VueMaterial);
  export default {
    name: 'web_wallpaper'
  }
</script>

<style> 
  @import url('https://fonts.googleapis.com/css?family=Roboto:400,500,700,400italic|Material+Icons');
  @import url("~/node_modules/firebaseui/dist/firebaseui.css");
</style>
