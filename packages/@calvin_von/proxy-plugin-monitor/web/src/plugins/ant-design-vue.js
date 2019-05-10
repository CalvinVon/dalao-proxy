import Vue from 'vue';
import { Input, Table, Spin, Icon, notification, Drawer } from 'ant-design-vue';

Vue.use(Input);
Vue.use(Table);
Vue.use(Spin);
Vue.use(Icon);
Vue.use(Drawer);
Vue.prototype.$notification = notification;

notification.config({
    placement: 'bottomRight',
    bottom: '50px',
});