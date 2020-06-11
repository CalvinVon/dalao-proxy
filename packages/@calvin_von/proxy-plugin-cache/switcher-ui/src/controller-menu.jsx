import { Switch, InputNumber, Input, Select, Radio, Checkbox, Tooltip, Icon, Button } from 'ant-design-vue';
import ArrowDownIcon from './components/arrow-down.functional';
import request from './request';

export default {
    name: 'controller-menu',
    props: ['parent'],
    components: {
        Switcher: Switch,
        Input,
        InputNumber,
        Select,
        Radio,
        Checkbox,
        Icon,
        Button
    },
    render() {
        return (
            <div class="plugin-cache-ui-switcher ui-swicher__content">
                <h3>Plugin Cache Switcher</h3>

                {
                    this.syncLoading ?
                        (
                            <div class="swicher-status">
                                Synchronizing
                                <Icon type="sync" spin={this.syncLoading} />
                            </div>
                        )
                        :
                        (
                            <div class="swicher-status">
                                <Button type="link" onclick={this.syncConfig}>
                                    Sync
                                    <Icon type="sync" />
                                </Button>
                            </div>
                        )
                }

                <div class="swicher-ui-controller">
                    {/* Cache */}
                    <div class="controller-group">
                        <h3 class="controller-group__title">Cache switcher</h3>
                        <ul class="controller-group__wrapper">

                            <li class="controller-item">
                                <div class="controller-item__label">
                                    <span>Enable</span>
                                </div>
                                <div class="controller-item__children">
                                    <Switcher size="small" vModel={this.cache.enable} />
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
                                            vModel={this.cache.maxAgeNumber}
                                            onchange={this.cacheMaxAgeNumberChange} />

                                        <Select
                                            size="small"
                                            vModel={this.cache.maxAgeUnit}>
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

                                    <p class="controller-item--desc">Quick switch</p>

                                    <Radio.Group
                                        size="small"
                                        vModel={this.fastMaxAgeSwitcher}
                                        onchange={this.fastMaxAgeSwitcherChange}>
                                        <Radio.Button value={0}>
                                            Real priority
                                        </Radio.Button>
                                        <Radio.Button value={1}>
                                            Cache priority
                                        </Radio.Button>
                                    </Radio.Group>
                                </div>
                            </li>

                            {
                                this.hiddenFields.cache ? null :
                                    (
                                        <ul>
                                            <li class="controller-item">
                                                <div class="controller-item__label">
                                                    <span>Content Type</span>
                                                </div>
                                                <div class="controller-item__children">
                                                    <Input.TextArea
                                                        value={this.cache.contentType.join('\n')}
                                                        onchange={e => this.cache.contentType = e.target.value.split('\n')} />

                                                    <p class="controller-item--desc">Use line breaks to enter multiple types</p>
                                                </div>
                                            </li>

                                            <li class="controller-item">
                                                <div class="controller-item__children no-label">
                                                    {
                                                        this.cache.filters.map(this.renderFilterItem)
                                                    }
                                                </div>
                                            </li>
                                        </ul>
                                    )
                            }

                            <li class="controller-item--hidden-indicator" onclick={this.cacheHiddenChange}>
                                <div class={{ 'up': !this.hiddenFields.cache }}>
                                    <ArrowDownIcon />
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Mock */}
                    <div class="controller-group">
                        <h3 class="controller-group__title">Mock switcher</h3>
                        <ul class="controller-group__wrapper">

                            <li class="controller-item">
                                <div class="controller-item__label">
                                    <span>Enable</span>
                                </div>
                                <div class="controller-item__children">
                                    <Switcher size="small" vModel={this.mock.enable} />
                                </div>
                            </li>
                            <li class="controller-item">
                                <div class="controller-item__label">
                                    <span>Prefix</span>
                                </div>
                                <div class="controller-item__children">
                                    <Input size="small" vModel={this.mock.prefix} />
                                    <p class="controller-item--desc">The prefix of the URL to mock</p>
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
            syncLoading: false,
            fastMaxAgeSwitcher: 0,
            hiddenFields: {
                cache: true,
                mock: true,
            },
            cache: {
                enable: true,
                maxAgeNumber: 0,
                maxAgeUnit: 'seconds',
                contentType: ["application/json"],
                filters: [
                    {
                        "field": null,
                        "value": 200,
                        "custom": null,
                        "applyRoute": "*",
                        "when": "response",
                        "where": "status"
                    },
                    {
                        "field": "code",
                        "value": 200,
                        "custom": null,
                        "applyRoute": "*",
                        "when": "response",
                        "where": "data"
                    }
                ]
            },
            mock: {
                enable: true,
                prefix: ''
            }
        }
    },
    watch: {
        'cache.enable'(val) {
            if (!val) {
                this.mock.enable = false;
            }
        },
        hiddenFields: {
            deep: true,
            handler() {
                this.parent.position.x++;
            }
        }
    },
    methods: {

        renderFilterItem(filter, index) {
            return (
                <div class="controller-group actionable">
                    <h3 class="controller-group__title">Filters [{index}]</h3>
                    <div class="controller-group__actions">
                        <div class="action-icon action-add" onclick={() => this.newFilter(filter)}>+</div>
                        <div class="action-icon action-delete" onclick={() => this.deleteFilter(filter)}>x</div>
                    </div>
                    <ul class="controller-group__wrapper">
                        <li class="controller-item">
                            <div class="controller-item__label">
                                <span>When</span>
                            </div>
                            <div class="controller-item__children">
                                <Select size="small" vModel={filter.when} onchange={val => this.filterWhenChange(filter, val)}>
                                    <Select.Option value="response">response</Select.Option>
                                    <Select.Option value="request">request</Select.Option>
                                </Select>
                            </div>
                        </li>
                        <li class="controller-item">
                            <div class="controller-item__label">
                                <span>Where</span>
                            </div>
                            <div class="controller-item__children">
                                {
                                    filter.when === 'response' ?
                                        (
                                            <Select size="small" vModel={filter.where}>
                                                <Select.Option value="status">status</Select.Option>
                                                <Select.Option value="header">header</Select.Option>
                                                <Select.Option value="data">data</Select.Option>
                                            </Select>
                                        ) :
                                        (
                                            <Select size="small" vModel={filter.where}>
                                                <Select.Option value="header">header</Select.Option>
                                                <Select.Option value="query">query</Select.Option>
                                                <Select.Option value="body">body</Select.Option>
                                            </Select>
                                        )
                                }
                            </div>
                        </li>
                        <li class="controller-item">
                            <div class="controller-item__label">
                                <span>Field</span>
                            </div>
                            <div class="controller-item__children">
                                <Input size="small" vModel={filter.field} disabled={filter.where === 'status'} />
                            </div>
                        </li>
                        <li class="controller-item">
                            <div class="controller-item__label">
                                <span>Value</span>
                            </div>
                            <div class="controller-item__children">
                                <div class="input-with-checkbox">
                                    {
                                        filter._isNumber ?
                                            <InputNumber size="small" vModel={filter.value} />
                                            : <Input size="small" vModel={filter.value} />
                                    }
                                    <Tooltip slot="suffix" title="Numeric type">
                                        <Checkbox vModel={filter._isNumber} onchange={() => this.filterNumberTypeChange(filter)}></Checkbox>
                                    </Tooltip>
                                </div>
                            </div>
                        </li>
                        <li class="controller-item">
                            <div class="controller-item__label">
                                <span>Route</span>
                            </div>
                            <div class="controller-item__children">
                                <Input size="small" vModel={filter.applyRoute} />
                                <p class="controller-item--desc">{
                                    filter.applyRoute === '*' ?
                                        'Apply to ALL ROUTES' :
                                        `Apply to route named \`${filter.applyRoute}\``
                                }</p>
                            </div>
                        </li>
                    </ul>
                </div>
            );
        },

        // max age
        cacheMaxAgeNumberChange(value) {
            this.fastMaxAgeSwitcher = value ? 1 : 0;
        },
        // fast switch
        fastMaxAgeSwitcherChange(e) {
            this.cache.maxAgeNumber = e.target.value ? '*' : 0;
        },

        newFilter(filter) {
            this.cache.filters.push({
                ...filter
            });
        },

        deleteFilter(filter) {
            this.cache.filters = this.cache.filters.filter(it => it !== filter);
        },


        // filter.when
        filterWhenChange(filter, val) {
            filter.where = {
                response: 'status',
                request: 'header',
            }[val];
        },

        // filter._isNumber for filter.value
        filterNumberTypeChange(filter) {
            const { value, _isNumber } = filter;
            if (_isNumber) {
                filter.value = Number(value) || 0;
            }
            else {
                filter.value = '' + value;
            }
        },


        // control hidden fields
        cacheHiddenChange() {
            this.hiddenFields.cache = !this.hiddenFields.cache;
        },


        // requests
        async syncConfig() {
            this.syncLoading = true;
            try {
                await request.sync();
            } catch (error) {
                console.error('error: ', error);
            } finally {
                this.syncLoading = false;
            }
        }
    }
}