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
        return switcher;
    }
}