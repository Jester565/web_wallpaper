<template> 
    <div class="dialog-div">
        <md-dialog-title>New Source</md-dialog-title>
        <md-content>
            <md-steppers md-linear md-dynamic-height :md-active-step.sync="activeStep">
                <!-- Pick type, set default config objects -->
                <md-step id="type-select" md-label="Select Source Type" :md-done="selectedType">
                    <div class="md-layout md-alignment-center"
                    v-for="sourceType in sourceTypes"
                    :key="sourceType.title">
                        <md-button 
                        @click="setType(sourceType)"
                        :disabled="sourceType === selectedType"
                        :md-ripple="false"
                        class="md-layout-item md-raised md-primary md-xlarge-size-25 md-large-size-33 md-medium-size-50 md-small-size-100 md-xsmall-size-100">
                            <div class="md-layout md-alignment-center">
                                <md-icon class="md-layout-item md-size-2x type-button-icon" :md-src="sourceType.icon"  /> <span class="md-layout-item type-button-title">{{sourceType.title}}</span>
                            </div>
                        </md-button>
                    </div>
                </md-step>
                <!-- Use RedditConfig, v-model of empty config -->
                <md-step id="source-config" md-label="Configure Source">
                    
                </md-step>
                <!-- Set name, confirm -->
                <md-step id="third" md-label="Confirm">
                    
                </md-step>
            </md-steppers>
        </md-content>
        <md-dialog-actions>
            <md-button class="md-primary" @click="showCloseDialog = true">Close</md-button>
        </md-dialog-actions>
        <md-dialog-confirm
        :md-active.sync="showCloseDialog"
        md-title="Discard Source?"
        md-content="Your source won't be added and configurations will be lost"
        md-confirm-text="Don't Save"
        md-cancel-text="Go Back!"
        @md-cancel="showCloseDialog = false"
        @md-confirm="close" />
    </div>
</template>
<script>
import firestoreHelper from '../utils/firestoreHelper'
import firebase from 'firebase'
const SOURCE_TYPES = [
    {
        icon: "/static/reddit.svg",
        title: "Reddit",
        config: {
            subreddit: "",
            minUpvotes: null,
            sortBy: "Hottest",
            timeSpan: "Week"
        }
    },
    {
        icon: "/static/gp.svg",
        title: "Google Photos",
        config: {
            //TODO
        }
    }]
 
export default {
    name: 'source_creator',
    created() { 
        
    },
    data() {
        return {
            showCloseDialog: false,
            selectedType: null,
            sourceTypes: SOURCE_TYPES,
            activeStep: 'type-select'
        }
    },
    methods: {
        setType(sourceType) {
            this.selectedType = sourceType;
            this.activeStep = 'source-config';
        },
        close() {
            this.$emit('close');
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

