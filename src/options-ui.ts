// istanbul ignore file -- launcher shim for the live UI

import launch from "./launch-vue";

import Main from "./options-ui.vue";

launch(Main, async () => ({propsData: {}}));
