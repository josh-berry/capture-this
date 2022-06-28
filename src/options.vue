<template>
<main>
    <label for="url_nosel">URL to open without any selected text:</label>
    <textarea name="url_nosel" autocomplete="off" spellcheck="false"
              v-model="options.url_nosel"></textarea>
    <div v-if="! isNoselUrlValid" :class="$style.error">Invalid URL</div>

    <label for="sel">URL to open with selected text:</label>
    <textarea name="url_sel" autocomplete="off" spellcheck="false"
              v-model="options.url_sel"></textarea>
    <div v-if="! isSelUrlValid" :class="$style.error">Invalid URL</div>

    <label><strong>Apply Preset:</strong></label>
    <ul>
        <li><a href="" @click.prevent="presetOmniFocus">OmniFocus</a></li>
        <li><A href="" @click.prevent="presetThings">Things</a></li>
    </ul>
</main>
</template>

<script lang="ts">
import launch from './launch-vue';
import {defineComponent, PropType} from 'vue';

import options from './options';

const Main = defineComponent({
    props: {
        options: {type: Object as PropType<typeof options>, required: true},
    },

    computed: {
        isNoselUrlValid() {
            try {
                new URL(this.options.url_nosel);
                return true;
            } catch (e) { return false; }
        },
        isSelUrlValid() {
            try {
                new URL(this.options.url_sel);
                return true;
            } catch (e) { return false; }
        }
    },

    methods: {
        presetOmniFocus() {
            this.options.url_nosel = 'omnifocus:///add?name=${title}&note=${title}%0A${url}';
            this.options.url_sel = 'omnifocus:///add?name=${selection}&note=${title}%0A${url}%0A%0A${selection}';
        },
        presetThings() {
            this.options.url_nosel = 'things:///add?title=${title}&notes=${title}%0A${url}&show-quick-entry=true';
            this.options.url_sel = 'things:///add?title=${selection}&notes=${title}%0A${url}%0A%0A${selection}&show-quick-entry=true';
        },
    },
});
export default Main;

launch(Main, async() => ({propsData: {options}}));
</script>

<style module>
/* controls options window size in Chrome */
html {
    min-width: 40rem;
}
main {
    display: grid;
    grid-template-rows: 1fr;
    row-gap: 1ex;
    column-gap: 1ex;
}
label {
    margin-top: 2ex;
}
ul {
    margin-top: 0;
    margin-bottom: 0;
}
.error {
    font-weight: bold;
    background-color: rgba(0, 0, 0, 10%);
    color: #c00000;
}

@media (prefers-color-scheme: dark) {
    .error {
        background-color: rgba(255, 255, 255, 10%);
        color: #ff8080;
    }
}
</style>
