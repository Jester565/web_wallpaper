<template> 
    <div class="md-layout full" :class="`md-alignment-top-space-around`">
        <div class="md-layout-item md-size-25 center-text">
            <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
        </div>
    </div>
</template>
<script>
export default {
    name: 'loading'
};
</script>

<style scoped>
    .full {
        width: 100vw;
        height: 100vh;
    }
</style>