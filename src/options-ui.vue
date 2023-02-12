<template>
  <main>
    <label for="url">URL to open without any selected text:</label>
    <textarea
      name="url"
      autocomplete="off"
      spellcheck="false"
      v-model="options.url"
    ></textarea>
    <div v-if="errors.url" :class="$style.error">{{ errors.url }}</div>

    <label for="urlWithSelection">URL to open with selected text:</label>
    <textarea
      name="urlWithSelection"
      autocomplete="off"
      spellcheck="false"
      v-model="options.urlWithSelection"
    ></textarea>
    <div v-if="errors.urlWithSelection" :class="$style.error">
      {{ errors.urlWithSelection }}
    </div>

    <label for="urlWithLink">URL to open with selected link:</label>
    <textarea
      name="urlWithLink"
      autocomplete="off"
      spellcheck="false"
      v-model="options.urlWithLink"
    ></textarea>
    <div v-if="errors.urlWithLink" :class="$style.error">
      {{ errors.urlWithLink }}
    </div>

    <label><strong>Apply Preset:</strong></label>
    <ul>
      <li v-for="preset of presets">
        <a href="" @click.prevent="applyPreset(preset)">{{ preset.title }}</a>
      </li>
    </ul>

    <label><strong>Variables:</strong></label>
    <ul>
      <li><tt>${pageTitle}</tt> - The page title</li>
      <li><tt>${pageUrl}</tt> - The URL of the open page</li>
      <li>
        <tt>${linkTitle}</tt> - The title of the link (if any), only applies
        when right-clicking on a link
      </li>
      <li>
        <tt>${linkUrl}</tt> - The URL of the link (if any), only applies when
        right-clicking on a link
      </li>
      <li>
        <tt>${selection}</tt> - Any text which is selected on the page (often
        same as linkUrl)
      </li>
    </ul>
  </main>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import OPTIONS from "./options";

type Preset = {
  title: string;
  urlWithLink: string;
  urlWithSelection: string;
  url: string;
};

const PRESETS: Preset[] = [
  {
    title: "OmniFocus",
    urlWithLink:
      "omnifocus:///add?name=${pageTitle}&note=${linkTitle}%0A${linkUrl}%0A%0A${pageTitle}%0A${pageUrl}",
    urlWithSelection:
      "omnifocus:///add?name=${selection}&note=${pageTitle}%0A${pageUrl}%0A%0A${selection}",
    url: "omnifocus:///add?name=${pageTitle}&note=${pageTitle}%0A${pageUrl}",
  },
  {
    title: "Things",
    urlWithLink:
      "things:///add?title=${pageTitle}&notes=${linkTitle}%0A${linkUrl}%0A%0A${pageTitle}%0A${pageUrl}&show-quick-entry=true",
    urlWithSelection:
      "things:///add?title=${selection}&notes=${pageTitle}%0A${pageUrl}%0A%0A${selection}&show-quick-entry=true",
    url: "things:///add?title=${pageTitle}&notes=${pageTitle}%0A${pageUrl}&show-quick-entry=true",
  },
];

function urlError(url: string): string {
  try {
    new URL(url);
    return "";
  } catch (e) {
    return "Invalid URL";
  }
}

export default defineComponent({
  props: {},

  computed: {
    presets(): Preset[] {
      return PRESETS;
    },
    options(): typeof OPTIONS {
      return OPTIONS;
    },

    errors(): {[k in keyof typeof OPTIONS]: string} {
      return {
        urlWithLink: urlError(OPTIONS.urlWithLink),
        urlWithSelection: urlError(OPTIONS.urlWithSelection),
        url: urlError(OPTIONS.url),
      };
    },
  },

  methods: {
    applyPreset(preset: Preset) {
      OPTIONS.urlWithLink = preset.urlWithLink;
      OPTIONS.urlWithSelection = preset.urlWithSelection;
      OPTIONS.url = preset.url;
    },
  },
});
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
