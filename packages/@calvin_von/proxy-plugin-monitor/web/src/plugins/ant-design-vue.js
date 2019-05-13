import Vue from 'vue';
import { Input, Table, Spin, Icon, notification, Tabs } from 'ant-design-vue';

Vue.use(Input);
Vue.use(Table);
Vue.use(Spin);
Vue.use(Icon);
Vue.use(Tabs);
Vue.prototype.$notification = notification;

notification.config({
    placement: 'bottomRight',
    bottom: '50px',
});