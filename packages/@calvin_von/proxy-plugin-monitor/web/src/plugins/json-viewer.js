import Vue from 'vue';

// see https://github.com/leezng/vue-json-pretty
import VueJsonPretty from "vue-json-pretty"
import 'vue-json-pretty/lib/styles.css';

Vue.component('json-viewer', VueJsonPretty);