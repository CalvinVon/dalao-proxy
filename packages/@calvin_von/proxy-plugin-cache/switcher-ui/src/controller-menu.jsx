import { Switch, InputNumber, Input, Select } from 'ant-design-vue';

export default {
    name: 'controller-menu',
    components: {
        Switcher: Switch,
        Input,
        InputNumber,
        Select,
    },
    render() {
        return (
            <div class="plugin-cache-ui-switcher ui-swicher__content">
                Cache Mock Switcher

                <div class="swicher-ui-controller">
                    <div class="controller-group">
                        <h3 class="controller-group__title">Cache switcher</h3>
                        <ul class="controller-group__wrapper">

                            <li class="controller-item">
                                <div class="controller-item__label">
                                    <span>Enable</span>
                                </div>
                                <div class="controller-item__children">
                                    <Switcher size="small" defaultChecked onchange={this.handleCacheSwitcher} />
                                </div>
                            </li>

                            <li class="controller-item">
                                <div class="controller-item__label">
                                    <span>Max age</span>
                                </div>
                                <div class="controller-item__children">
                                    <Input.Group compact>
                                        <InputNumber
                                            size="small"
                                            min={0}
                                            defaultValue={0}
                                            onchange={this.handleCacheSwitcher} />
                                        <Select size="small" defaultValue="seconds">
                                            <Select.Option value="seconds">
                                                sec
                                            </Select.Option>
                                            <Select.Option value="minutes">
                                                min
                                            </Select.Option>
                                            <Select.Option value="hours">
                                                hour
                                            </Select.Option>
                                        </Select>
                                    </Input.Group>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    },
    data() {
        return {

        }
    },
    methods: {
        // cache switcher
        handleCacheSwitcher(e) {
            console.log(e);
        },

        // cache switcher
        handleCacheMaxAge(e) {
            console.log(e);
        }
    }
}