<template> 
    <div>
    </div>
</template>
<script>
import axios from 'axios';
 
export default {
    name: 'reddit_config',
    created() { 
        
    },
    props: [
        'value'
    ],
    data() {
        return {
            //maps subreddits to true if exists, false otherwise, null means haven't checked
            subredditExistances: {}
        }
    },
    computed: {
        canVerify() {
            return (this.value.subreddit.length > 0 && this.subredditErrorMsg === null);
        },
        subredditErrorMsg() {
            if (this.subredditExistances[this.value.subreddit] === false) {
                return "The subreddit does not exist";
            }
            return null;
        }
    },
    methods: {
        onVerify() {

        }
    },
    components: {  }
};
</script>
 
<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
    @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic');

    .type-button {
        height: 100px;
    }

    .dialog-div {
        min-width: 600px;
        width: 75vw;
    }

    .type-button-icon {
        margin-right: 20px;
        width: 5em;
    }

    .type-button-title {
        margin-left: 20px;
        width: 20em;
    }
</style>

