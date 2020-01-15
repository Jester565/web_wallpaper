<template> 
    <div>
        <md-dialog-title>Image Sources</md-dialog-title>
        <md-dialog-actions>
            <md-button class="md-primary" @click="close()">Close</md-button>
            <md-button class="md-primary" @click="save()">Save</md-button>
        </md-dialog-actions>
    </div>
</template>
<script>
export default {
    name: 'img_source_row',
    methods: {
        close: () => {
            
        }
    }
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