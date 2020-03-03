<template>
    <div v-if="source">
        <div class="md-layout md-alignment-center-center">
            <md-icon class="md-layout-item md-size-3x type-button-icon" :md-src="sourceType.icon"  />
            <span class="md-layout-item md-display-3 type-button-title">{{ sourceType.displayName }}</span>
        </div>
        <div>
            <md-field>
                <label>Name</label>
                <md-input 
                v-model="source.name" 
                :disabled="saving"
                :placeholder="suggestedName"></md-input>
            </md-field>
            <like-rater v-model="source.rating" :disabled="saving" />
        </div>
        <component :is="source.type" 
        v-model="source.typeConfig" 
        :validateBus="validateBus"
        :disabled="saving"
        @onValidated="onValidated"
        @checkableChanged="typeConfigCheckable = $event"
        @suggestedNameChanged="suggestedName=$event" />
        <md-button 
        :disabled="!typeConfigCheckable || saving"
        @click="onSave"
        class="md-raised md-primary">Done</md-button>
    </div>
</template>
<script>
import Vue from 'vue'
import _ from 'lodash'
import firestoreHelper from '../utils/firestoreHelper'
import firebase from 'firebase'
import { ConfigComponents as TypeConfigComponents, Consts as TypeConsts } from './SourceTypeConfigs/index'
import LikeRater from './LikeRater'

const DEFFAULT_RATING = 5;
 
export default {
    name: 'source_config',
    props: [ "value", "sourceID", "userID" ],
    data() {
        return {
            source: null,
            remoteSource: null,
            saving: false,
            suggestedName: "Name",
            validateBus: new Vue(),
            typeConfigCheckable: false,
            prevIsModified: false
        }
    },
    computed: {
        sourceType() {
            return (this.source != null)? TypeConsts[this.source.type]: null; 
        }
    },
    watch: {
        value: {
            handler (newSource, prevSource) {
                this.remoteSource = _.cloneDeep(newSource);
                if (newSource != null) {
                    if (this.source != null) {
                        //nested objects should always be updated, so typeconfig changes should be triggered
                        _.assignWith(this.source, newSource, (currentVal, newVal, key) => {
                            if (currentVal !== prevSource[key]) {
                                return currentVal;
                            } else {
                                return newVal;
                            }
                        });
                    } else {
                        this.source = _.cloneDeep(newSource);
                    }
                }
            },
            immediate: true
        },
        source: {
            handler (newSource) {
                let isModified = Object.keys(firestoreHelper.getDataDiff(newSource, this.remoteSource)).length > 0;
                if (isModified !== this.prevIsModified) {
                    this.$emit("isModifiedChanged", isModified);
                    this.prevIsModified = isModified;
                }
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        onSave() {
            this.saving = true;
            this.validateBus.$emit("validate");
        },
        async onValidated(valid) {
            if (valid) {
                await this.save();
            } else {
                this.saving = false;
            }
        },
        //use map for devices so that saving is easier
        async save() {
            if (this.source.name == null || this.source.name.length == 0) {
                this.source.name = this.suggestedName;
            }
            //update modified & created times
            if (this.source.created == null) {
                this.source.created = Date.now();
            }
            this.source.modified = Date.now();
            //update modified data timestamps
            try {
                await firebase
                .firestore()
                .collection('users')
                .doc(this.userID)
                .set({
                    sources: {
                        [this.sourceID]: this.source
                    }
                }, { merge: true });
                //Update remoteSource since local data was set
                this.remoteSource = _.cloneDeep(this.source);
                //Pass new source to parent
                this.$emit("onSave", _.cloneDeep(this.source));
            } catch (e) {
                console.warn("Could not set device: ", this.deviceID, e);
            }
            this.saving = false;
        }
    },
    components: { ...TypeConfigComponents, LikeRater }
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
 
 