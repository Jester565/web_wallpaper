<template> 
    <div>
        <div class="top-bar"> 
            <div class="md-layout md-gutter md-alignment-center-right"> 
                <md-field class="md-layout-item order-by-select">
                    <label for="sourceSort">Sort By</label>
                    <md-select v-model="sortBy" name="sortBy" id="sourceSort">
                        <md-option
                        v-for="value in sortOptions"
                        :key="value"
                        :value="value">{{value}}</md-option>
                    </md-select>
                </md-field>
                <md-switch class="md-layout-item reverse-switch" v-model="reverse">Reverse</md-switch>
            </div>
        </div>
        <div class="md-layout md-gutter md-alignment-center">
            <div 
            v-for="source in sortedSources"
            :key="source.id"
            class="md-layout-item md-xlarge-size-20 md-large-size-25 md-medium-size-33 md-small-size-50 md-xsmall-size-100">
                <source-card :userID="userID" :source="source" :sourceID="source.id"  />
            </div>
            <div class="md-layout-item md-xlarge-size-20 md-large-size-25 md-medium-size-33 md-small-size-50 md-xsmall-size-100">
                <md-card class="md-elevation-14 add-card">
                    <md-card-media-cover md-solid>
                        <md-card-media md-ratio="4:3">
                            <img class="add-img" src="/static/new_source.webp" alt="Sources">
                        </md-card-media>
                        <md-card-area>
                            <md-card-header>
                                <span class="md-title">Add Source</span>
                                <span class="md-subhead">Get more wallpapers from several places</span>
                            </md-card-header>
                            <md-card-actions>
                                <md-button class="md-icon-button add-button" @click="addSourceOpen = true">
                                    <md-icon class="md-size-5x">add_circle_outline</md-icon>
                                </md-button>
                            </md-card-actions>
                        </md-card-area>
                    </md-card-media-cover>
                </md-card>
            </div>
        </div>
        <md-dialog :md-active.sync="addSourceOpen">
            <source-creator :userID="userID" @close="addSourceOpen = false" />
        </md-dialog>
    </div>
</template>
<script>
import SourceCreator from './SourceCreator'
import SourceCard from './SourceCard'
import firestoreHelper from '../utils/firestoreHelper'
import firebase from 'firebase'
const SortOptions = {
    ALPH: 'Alphebetical',
    CREATED: 'Creation',
    MODIFIED: 'Modified',
    FAVOR: 'Favor'
}
 
const DEFAULT_SORT_BY = SortOptions.ALPH;
 
export default {
    name: 'source_cards',
    created() { 
        this.sortBy = (localStorage.sourceSortBy)? localStorage.sourceSortBy: DEFAULT_SORT_BY;
        this.reverse = (localStorage.reverse)? localStorage.sourceReverse: false;
        this.userObserverUnsubscribe = 
            this.subscribeToUser(this.userID, this.onUserUpdate);
    },
    props: {
        userID: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            sources: null,
            sortBy: DEFAULT_SORT_BY,
            reverse: false,
            addSourceOpen: false,
            sortOptions: SortOptions
        }
    },
    beforeDestroy() {
        if (this.userObserverUnsubscribe != null) {
            this.userObserverUnsubscribe();
        }
    },
    watch: {
        sortBy (newSortBy, oldSortBy) {
            if (newSortBy !== oldSortBy) {
                localStorage.sourceSortBy = newSortBy;
            }
        },
        reverse (newReverse, oldReverse) {
            if (newReverse !== oldReverse) {
                localStorage.sourceReverse = newReverse;
            }
        }
    },
    computed: {
        sortedSources () {
            if (this.sources && this.sortBy) {
                let sourcesArr = [];
                for (let sourceID in this.sources) {
                    sourcesArr.push({
                        id: sourceID,
                        ...this.sources[sourceID]
                    });
                }
                return sourcesArr.sort((source1, source2) => {
                    let sortVal = 0;
                    if (this.sortBy === SortOptions.ALPH) {
                        sortVal = source1.name.localeCompare(source2.name);
                    } else if (this.sortBy === SortOptions.CREATED) {
                        //TODO: ensure dates are parsed correctly
                        sortVal = source1.created - source2.created;
                    } else if (this.sortBy === SortOptions.MODIFIED) {
                        sortVal = source1.modified - source2.modified;
                    } else if (this.sortBy === SortOptions.FAVOR) {
                        sortVal = source1.favor - source2.favor;
                    }
                    return ((this.reverse)? (-1 * sortVal): sortVal);
                });
            }
            return [];
        }
    },
    methods: {
        subscribeToUser(userID, onUpdate) {
            let userRef = firebase
            .firestore()
            .collection('users')
            .doc(userID);
            return userRef.onSnapshot(
            onUpdate,
            err => {
                console.log(`Error watching user: ${err}`);
            });
        },
        onUserUpdate(user) {
            if (user.exists) {
                let userData = user.data();
                this.sources = userData.sources;
            }
        }
    },
    components: { 'source-creator': SourceCreator, 'source-card': SourceCard }
};
</script>
 
<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
    @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic');

    .add-button {
        width: 100px;
        height: 100px;
    }

    .add-card {
        border: solid black 2px;
    }

    .add-img {
        width: 100%;
        object-fit: contain;
    }

    .top-bar {
        width: 100%;
        background-color: #111;
        padding-top: 20px;
        padding-bottom: 10px;
        padding-left: 10px;
        margin-bottom: 10px;
    }

    .order-by-select {
        max-width: 40em;
    }
    .reverse-switch {
        max-width: 15em;
    }
</style>

