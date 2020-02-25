<template> 
    <div class="md-layout md-alignment-center-left">
        <md-field class="md-layout-item">
            <chrome-color-picker :class="{ 'no-input': disabled }" :value="color" @input="onColorUpdate" />
        </md-field>
        <div class="md-layout-item off-colors-div">
            <div>
                <span class="md-subheading">Range</span>
                <br />
                <input type="range" 
                class="range"
                :value="off" 
                @input="onOffUpdate($event.target.value)"
                :disabled="disabled"> 
                <span class="range-output">{{ off }}%</span>
            </div>
            <br />
            <span class="md-subheading">Accepted Colors</span>
            <div v-if="offColors" class="md-layout">
                <div 
                v-for="offColor in offColors"
                :key="offColor"
                :style="{ 'background-color': offColor, 'background': offColor }"
                class="md-layout-item off-color" />
            </div>
        </div>
    </div>
</template>
<script>
import { Chrome } from 'vue-color'
import _ from 'lodash';

export default {
    name: 'color-picker',
    props: [
        "color",
        "off",
        "disabled"
    ],
    methods: {
        onColorUpdate (color) {
            this.$emit('update:color', color.rgba);
        },
        onOffUpdate (off) {
            this.$emit('update:off', off);
        },
    },
    computed: { 
      	offColors() {
            if (this.color == null || this.off == null) {
                return null;
            }

            let colorObjToArr = (colorObj) => {
                return [ colorObj.r, colorObj.b, colorObj.b ];
            }

            //get min and max distance from color
            let getColorDiffs = (channels, off) => {
                //convert off to range between 0 - 255
                let colorDist = (off / 100.0) * 255;
                //max difference between channel and min & max val
                let colorDiff = Math.sqrt(Math.pow(colorDist, 2) / channels.length);
                let minColor = [];
                for (let color of channels) {
                    minColor.push((color - colorDiff > 0)? color - colorDiff: 0);
                }
                let maxColor = [];
                for (let color of channels) {
                    maxColor.push((color + colorDiff < 255)? color + colorDiff: 255);
                }
                return [minColor, maxColor];
            }

            //convergs [r, g, b] arr to string usable for css
            let colorArrToStr = (colorArr) => {
                let str = `rgb(`;
                _.forEach(colorArr, (colorCode, i) => {
                    str += Math.round(colorCode);
                    str += (i < colorArr.length - 1)? ',': ')'
                });
                return str;
            }

            //get permutations of indices of targetSize for an array of arrSize
            // ex. get...(4, 3) results in [[0, 1, 2], [0, 1, 3], [1, 2, 3]]
            let getIdxPermutations = (arrSize, targetSize, startI = 0) => {
                let result = [];
                for (let i = startI; i <= arrSize - targetSize; i++) {
                    if (targetSize > 1) {
                        let perms = getIdxPermutations(arrSize, targetSize - 1, i + 1);
                        for (let perm of perms) {
                            result.push([i, ...perm]);
                        }
                    } else {
                        result.push([i]);
                    }
                }
                return result;
            }

            let color = colorObjToArr(this.color);

            let idxPermutations = [];
            //get colors where only 1 code is changed, 2 codes are changed, etc.
            for (let i = 1; i <= color.length; i++) {
                idxPermutations = idxPermutations.concat(getIdxPermutations(color.length, i));
            }
            let offColorStrs = [];
            for (let modChannelIs of idxPermutations) {
                //Array containing only values of channels to be modified
                let modChannels = [];
                for (let channelI of modChannelIs) {
                    modChannels.push(color[channelI]);
                }
                //Contains array of min & max of channels
                let moddedChannelsArr = getColorDiffs(modChannels, this.off);
                //merge modified channels with original color
                for (let moddedChannels of moddedChannelsArr) {
                    let offColor = [...color];
                    for (let k = 0; k < modChannelIs.length; k++) {
                        let channelI = modChannelIs[k];
                        let channelVal = moddedChannels[k];
                        offColor[channelI] = channelVal;
                    }
                    offColorStrs.push(colorArrToStr(offColor));
                }
            }
            let uniqOffColors = _.uniq(offColorStrs);
            //remove duplicate colors
            return uniqOffColors;
        }
    },
    components: { 'chrome-color-picker': Chrome }
};
</script>

<style scoped>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
    @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,400italic');

    .disabled {
        background: #111111;
    }

    .off-colors-div {
        width: 200px;
        max-width: 200px;
        margin-left: 15px;
    }

    .off-color {
        height: 20px;
    }

    .no-input {
        pointer-events:none;
    }
</style>