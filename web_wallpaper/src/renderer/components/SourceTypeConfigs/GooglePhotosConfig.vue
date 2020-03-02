<template> 
    <div v-if="value">
    </div>
</template>
<script>
import axios from 'axios';
import _ from 'lodash';
export default {
    name: 'gp_config',
    props: [ "value", "validateBus", "disabled" ],
    data() {
        return {
           
        }
    },
    computed: {
        isCheckable() {
           
        }
    },
    methods: {
        
    }
};
</script>
 
<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
    @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic');
</style>
 
 