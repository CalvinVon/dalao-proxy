import Vue from 'vue';
import { Input, Table, Spin, Icon, notification, Tabs, Tooltip, Button } from 'ant-design-vue';

Vue.use(Input);
Vue.use(Table);
Vue.use(Spin);
Vue.use(Icon);
Vue.use(Tabs);
Vue.use(Button);
Vue.use(Tooltip);
Vue.prototype.$notification = notification;

notification.config({
    placement: 'bottomRight',
    bottom: '50px',
});