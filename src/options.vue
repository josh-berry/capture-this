<template>
<main :class="{[$style.main]: true}">
    <label for="url_nosel">URL to open without any selected text:</label>
    <textarea name="url_nosel" autocomplete="off" spellcheck="false"
              v-model.lazy="options.url_nosel"></textarea>
    <label for="sel">URL to open with selected text:</label>
    <textarea name="url_sel" autocomplete="off" spellcheck="false"
              v-model.lazy="options.url_sel"></textarea>
</main>
</template>

<script lang="ts">
import launch from './launch-vue';
import Vue, {PropType} from 'vue';

import options from './options';

const Main = Vue.extend({
    props: {
        options: Object as PropType<typeof options>,
    },
});
export default Main;

launch(Main, {options});
</script>

<style module>
/* controls options window size in Chrome */
html {
    min-width: 40rem;
}
.main {
    display: grid;
    grid-template-rows: 1fr;
    row-gap: 1ex;
    column-gap: 1ex;
}
</style>
