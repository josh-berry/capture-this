// istanbul ignore file -- launcher shim for the live UI

import launch from './launch-vue';

import options from './options';

launch(require('./options-ui.vue').default, async() => ({propsData: {options}}));
