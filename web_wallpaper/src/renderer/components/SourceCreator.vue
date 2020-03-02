<template> 
    <div class="dialog-div">
        <md-dialog-title>New Source</md-dialog-title>
        <md-content>
            <md-steppers md-linear md-dynamic-height :md-active-step.sync="activeStep">
                <!-- Pick type, set default config objects -->
                <md-step id="type-select" md-label="Select Source Type" :md-done="selectedType != null">
                    <div class="md-layout md-alignment-center"
                    v-for="(consts, type) in typeConsts"
                    :key="type">
                        <md-button 
                        @click="setType(type)"
                        :disabled="type === selectedType"
                        :md-ripple="false"
                        class="md-layout-item md-raised md-primary md-xlarge-size-25 md-large-size-33 md-medium-size-50 md-small-size-100 md-xsmall-size-100">
                            <div class="md-layout md-alignment-center">
                                <md-icon class="md-layout-item md-size-2x type-button-icon" :md-src="consts.icon" /> <span class="md-layout-item type-button-title">{{consts.displayName}}</span>
                            </div>
                        </md-button>
                    </div>
                </md-step>
                <!-- Use RedditConfig, v-model of empty config -->
                <md-step id="source-config" md-label="Configure Source">
                    <source-config v-if="source != null" 
                    :value="source" 
                    :userID="userID" 
                    :sourceID="sourceID"
                    @onSave="onSave" />
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
import SourceConfig from './SourceConfig'
import { Consts as TypeConsts } from './SourceTypeConfigs/index'
import { v4 as uuidv4 } from 'uuid'
import firestoreHelper from '../utils/firestoreHelper'
import firebase from 'firebase'
import _ from 'lodash';
 
export default {
    name: 'source_creator',
    created() { 
        this.sourceID = uuidv4();
    },
    props: [ "userID" ],
    data() {
        return {
            showCloseDialog: false,
            selectedType: null,
            typeConsts: TypeConsts,
            activeStep: 'type-select',
            sourceID: null,
            source: null
        }
    },
    methods: {
        createInitSource(type) {
            return {
                name: "",
                rating: 5,
                type: type,
                typeConfig: _.cloneDeep(TypeConsts[type].initConfig)
            }
        },
        setType(typeID) {
            if (typeID !== this.selectedType) {
                this.source = this.createInitSource(typeID);
            }
            this.selectedType = typeID;
            this.activeStep = 'source-config';
        },
        onSave(source) {
            this.$emit('close', source);
        },
        close() {
            this.$emit('close');
        }
    },
    components: { 'source-config': SourceConfig }
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

