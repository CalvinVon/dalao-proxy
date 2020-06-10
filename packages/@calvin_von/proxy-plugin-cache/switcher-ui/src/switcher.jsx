import { Popover } from 'ant-design-vue';

import ControllerMenu from './controller-menu';
import './style.scss';

const storageKey = '__cache_switcher_ui_position__';

export default {
    name: 'plugin-switcher',
    component: {
        Popover,
        ControllerMenu,
    },
    render() {
        return (
            <div class="plugin-cache-ui-switcher">
                <Popover visible={this.active} placement="left">
                    <ControllerMenu slot="content" />

                    <div class={["switcher-handler", { active: this.active }]}
                        onclick={this.onclick}
                        ontouchmove={this.onclick}
                        onmousedown={this.onmousedown}
                        style={this.style}></div>
                </Popover>
            </div >
        );
    },
    data() {
        return {
            dragging: false,
            holding: false,
            active: true,
            position: {}
        }
    },
    computed: {
        style() {
            const { x, y } = this.position;
            return {
                top: y - 10 + 'px',
                left: x - 10 + 'px',
            }
        }
    },
    watch: {
        position(newV) {
            localStorage.setItem(storageKey, JSON.stringify(newV));
        }
    },
    mounted() {
        this.position = JSON.parse(localStorage.getItem(storageKey)) || {};
        window.addEventListener('mousemove', this.onmousemove);
        window.addEventListener('mouseup', this.onmouseup);
    },
    beforeDestroy() {
        window.removeEventListener('mousemove', this.onmousemove);
        window.removeEventListener('mouseup', this.onmouseup);
    },

    methods: {
        onclick() {
            if (!this.dragging) {
                this.active = !this.active;
            }
        },
        onmousedown() {
            this.holding = true;
        },

        onmousemove({ x, y }) {
            if (this.holding) {
                this.dragging = true;
                if (x < 0) x = 0;
                if (x > window.innerWidth - 20) x = window.innerWidth - 20;
                if (y < 0) y = 0;
                if (y > window.innerHeight) y = window.innerHeight;
                this.position = { x, y };
            }
        },
        onmouseup() {
            this.holding = false;
            setTimeout(() => {
                this.dragging = false;
            });
        }
    }
}