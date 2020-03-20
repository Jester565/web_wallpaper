<template>
    <div v-if="source">
        <div class="config-div">
            <div class="md-layout md-alignment-center-left">
                <md-icon class="md-layout-item md-size-2x type-icon" :md-src="sourceType.icon"  />
                <span class="md-layout-item md-display-2 type-title">{{ sourceType.displayName }}</span>
            </div>
            <div class="field-div">
                <div>
                    <md-field>
                        <label>Name</label>
                        <md-input 
                        v-model="source.name" 
                        :disabled="saving"
                        :placeholder="suggestedName"></md-input>
                    </md-field>
                    <like-rater v-model="source.rating" :disabled="saving" />
                    <div class="md-layout md-alignment-center-center">
                        <md-button 
                        :class="{ 'filter-button': true, 'md-raised': true, 'md-primary': !source.noFaces, 'md-accent': source.noFaces }"
                        @click="source.noFaces = !source.noFaces">
                            <div class="filter-icon-wrapper">
                                <md-icon class="md-layout-item md-size-3x filter-icon">face</md-icon>
                                <md-icon v-if="source.noFaces" class="md-layout-item md-size-3x filter-over-icon">clear</md-icon>
                                <span class="md-caption">{{((source.noFaces)? 'Excluding': 'Including')}} Faces</span>
                            </div>
                            <md-tooltip md-direction="top">Images with faces are currently {{((source.noFaces)? 'not allowed': 'allowed')}}</md-tooltip>
                        </md-button>
                        <md-button 
                        :class="{ 'filter-button': true, 'md-raised': true, 'md-primary': !source.noText, 'md-accent': source.noText }"
                        @click="source.noText = !source.noText">
                            <div class="filter-icon-wrapper">
                                <md-icon class="md-layout-item md-size-3x filter-icon">text_format</md-icon>
                                <md-icon v-if="source.noText" class="md-layout-item md-size-3x filter-over-icon">clear</md-icon>
                                <span class="md-caption">{{((source.noText)? 'Excluding': 'Including')}} Text</span>
                            </div>
                            <md-tooltip md-direction="top">Images with text are currently {{((source.noText)? 'not allowed': 'allowed')}}</md-tooltip>
                        </md-button>
                    </div>
                </div>
                <component :is="source.type" 
                v-model="source.typeConfig" 
                :validateBus="validateBus"
                :disabled="saving"
                @onValidated="onValidated"
                @checkableChanged="typeConfigCheckable = $event"
                @suggestedNameChanged="suggestedName=$event" />
            </div>
        </div>
        <md-button 
        v-if="saveBus == null"
        :disabled="!canSave"
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
    props: [ "value", "sourceID", "userID", "saveBus" ],
    mounted() {
        if (this.saveBus != null) {
            this.saveBus.$on("save", this.onSave);
        }
    },
    data() {
        return {
            source: null,
            remoteSource: null,
            saving: false,
            suggestedName: "Name",
            validateBus: new Vue(),
            typeConfigCheckable: false,
            prevIsModified: false,
            prevCanSave: false
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
        },
        typeConfigCheckable: {
            handler (isCheckable) {
                let canSave = (!this.saving && isCheckable);
                if (canSave != this.prevCanSave) {
                    this.$emit("canSaveChanged", canSave);
                    this.prevCanSave = canSave;
                }
                this.canSave = canSave;
            }
        },
        saving: {
            handler (saving) {
                let canSave = (!saving && this.typeConfigCheckable);
                if (canSave != this.prevCanSave) {
                    this.$emit("canSaveChanged", canSave);
                    this.prevCanSave = canSave;
                }
                this.canSave = canSave;
            }
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
                this.$emit("onSaved", _.cloneDeep(this.source));
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
 
    .type-icon {
        margin-right: 8px;
        max-width: 2em;
    }
 
    .type-title {
        margin-left: 8px;
    }

    .config-div {
        overflow-y: scroll;
        height: 45vh;
        width: 100%;
        padding-right: 18px;
    }

    .field-div {
        margin-left: 4em;
    }

    .filter-button {
        margin-left: 10px;
        margin-right: 10px;
        min-width: 80px;
        min-height: 60px;
    }

    .filter-icon-wrapper {
        background: transparent;
    }

    .filter-over-icon {
        position: absolute;
        top: 0px;
        left: 0px;
        color: #FF0000 !important;
    }
</style>
 
 