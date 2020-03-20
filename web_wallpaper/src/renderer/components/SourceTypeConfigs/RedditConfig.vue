<template> 
    <div v-if="value">
        <md-field :class="{ 'md-invalid': (subredditErrorMsg != null) }">
            <label>Subreddit</label>
            <span class="md-prefix">r/</span>
            <md-input 
            v-model="value.subreddit" 
            @input="onSubredditChanged"
            :disabled="disabled || verifying" required></md-input>
            <span class="md-error">{{ subredditErrorMsg }}</span>
        </md-field>
 
        <md-field>
            <label for="sortBy">Sort By</label>
            <md-select v-model="value.sortBy" name="sortBy" id="sortBy" :disabled="disabled || verifying">
                <md-option
                v-for="(val, key) in sortBys"
                :key="val"
                :value="val">{{ key }}</md-option>
            </md-select>
        </md-field>
 
        <md-field>
            <label for="timeSpan">Time Span</label>
            <md-select v-model="value.timeSpan" name="timeSpan" id="timeSpan" :disabled="(value.sortBy !== sortBys.Top) || disabled || verifying">
                <md-option
                v-for="(val, key) in timeSpans"
                :key="val"
                :value="val">{{ key }}</md-option>
            </md-select>
        </md-field>
 
        <md-field>
            <label>MinUpvotes</label>
            <md-input v-model="value.minUpvotes" :disabled="disabled || verifying" type="Number"></md-input>
        </md-field>
    </div>
</template>
<script>
import axios from 'axios';
import _ from 'lodash';
const SortBy = {
    Top: "top",
    Hot: "hot"
};
 
const TimeSpans = {
    Day: "day",
    Week: "week",
    Month: "month",
    Year: "year",
    'All Time': "all-time"
};
 
export default {
    name: 'reddit',
    mounted() {
        this.validateBus.$on("validate", this.onValidate);
    },
    props: [ "value", "validateBus", "disabled" ],
    data() {
        return {
            //maps subreddits to true if exists, false otherwise, null means haven't checked
            subredditExistances: {},
            verifying: false,
            prevIsValid: false,
            sortBys: SortBy,
            timeSpans: TimeSpans
        }
    },
    computed: {
        subredditErrorMsg() {
            if (this.subredditExistances[this.value.subreddit] === false) {
                return "The subreddit does not exist";
            }
            return null;
        }
    },
    watch: {
        value: {
            handler (value) {
                let valid = (value.subreddit != null && 
                value.subreddit.length > 0 && 
                value.sortBy != null &&
                ((value.sortBy != SortBy.Top) || (value.timeSpan != null)));
                if (valid !== this.prevIsValid) {
                    this.$emit('checkableChanged', valid);
                    this.prevIsValid = valid;
                }
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        async onValidate() {
            let subreddit = this.value.subreddit;
            let exists = (this.subredditExistances[subreddit] != null)? 
                this.subredditExistances[subreddit]: (await this.doesSubredditExist(subreddit));
            this.subredditExistances[subreddit] = exists;
            this.$emit('onValidated', exists);
        },
        async doesSubredditExist(subreddit) {
            this.verifying = true;
            let statusCode = null;
            try {
                let res = await axios.get(`https://reddit.com/r/${subreddit}`, {
                    headers: {'Access-Control-Allow-Origin': '*'}
                });
                statusCode = res.status;
            } catch (err) {
                if (err.response) {
                    statusCode = err.response.status;
                }
            }
            this.verifying = false;
            if (Math.trunc(statusCode / 100) === 2) {
                return true;
            } else if (statusCode === 404){
                return false;
            } else {
                console.warn("Unexpected status for subreddit exist check: ", statusCode);
                return true;
            }
        },
        onSubredditChanged(subreddit) {
            this.$emit("suggestedNameChanged", subreddit);
        }
    }
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