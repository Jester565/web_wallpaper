<template>
    <div>
        <div class="md-layout" :class="`md-alignment-center-center`">
            <div class="src-wrapper md-layout-item md-size-80">
                <div class="md-layout" v-on:click="configure()" :class="`md-alignment-center-left`">
                    <div class="md-layout-item md-size-20">
                        <md-icon class="md-size-2x" md-src="static/reddit.svg" />
                    </div>
                    <div class="md-layout-item md-size-70">
                        <span class="md-headline  v-align-middle">Reddit</span> 
                    </div>
                    <div class="md-layout-item md-size-10 right-text">
                        <div class="icon-container">
                            <md-icon class="md-size-2x" md-src="static/fheart.svg" />
                            <span class="md-subheading centered">5</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <md-dialog :md-active.sync="showConfig">
            
        </md-dialog>
    </div>
</template>
<script>
export default {
    name: 'img_source_row',
    data(){
        return {
            showConfig: false
        }
    },
    methods: { 
        configure() { 
            showConfig = true;
        }  
    },
};
</script>

<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
    @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic');

    .icon-container {
        position: relative;
        text-align: center;
    }

    .src-wrapper {
        background: rgba(0, 0, 0, 0.8);
        border-color: #000000;
        border-width: 3px;
        border-radius: 10px;
        width: 100%;
        border-style: solid;
    }


    .v-align-middle { 
        vertical-align: middle;
    }

    .centered {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
</style>