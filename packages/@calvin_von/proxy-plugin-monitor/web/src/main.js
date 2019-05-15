import Vue from 'vue';
import App from './App.vue';
import './filters';
import './plugins/ant-design-vue';
import './plugins/json-viewer';
import 'minireset.css';
import './styles/index.scss';

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app');
