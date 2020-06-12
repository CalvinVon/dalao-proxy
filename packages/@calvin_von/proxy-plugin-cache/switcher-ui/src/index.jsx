import Vue from 'vue';
import PluginUISwitcher from './switcher';

export default class Switcher {
    constructor(target) {
        this.instance = null;
        this.init(document.querySelector(target));
    }

    init(el) {
        const switcher = this.instance = new Vue({
            render() {
                return (
                    <PluginUISwitcher />
                );
            }
        }).$mount();
        el.appendChild(switcher.$el);
        console.log(
            `%c Plugin Cache v1.2.0-beta %c UI-Switcher attached %c`,
            'background:#1976d2 ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff',
            'background:#35495e ; padding: 1px; border-radius: 0 3px 3px 0;  color: #fff',
            'background:transparent'
        )
        return switcher;
    }
}