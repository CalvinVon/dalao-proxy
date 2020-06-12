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

                <div class="ui-switcher-controller__header">
                    <h3 class="header-title">Plugin Cache Switcher</h3>

                    <div class="swicher-status">
                        {
                            this.sync.error ?
                                <span class="status-error">Sync error </span>
                                : null
                        }

                        <Button
                            type="link"
                            onclick={this.syncConfig}
                            disabled={this.sync.loading}>
                            <Icon type="sync" spin={this.sync.loading} />
                            {this.sync.loading ? 'Synchronizing' : 'Sync'}
                        </Button>

                        {
                            this.upload.error ?
                                <span class="status-error">Save error</span>
                                : null
                        }

                        <Button
                            type="link"
                            onclick={this.uploadConfig}
                            disabled={this.upload.loading}>
                            {
                                this.upload.loading ?
                                    <Icon type="sync" spin />
                                    : <Icon type="check" />
                            }
                            {this.upload.loading ? 'Saving' : 'Save'}
                        </Button>

                        <Button
                            type="link"
                            onclick={this.reloadServer}>
                            <Icon type="reload" />
                            Reload server
                        </Button>
                    </div>
                </div>

                <div class="ui-switcher-controller">
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
                                                seconds
                                            </Select.Option>
                                            <Select.Option value="minutes">
                                                minutes
                                            </Select.Option>
                                            <Select.Option value="hours">
                                                hours
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

                                            {
                                                this.cache.filters.length ? null :
                                                    <li class="controller-item">
                                                        <div class="controller-item__label">
                                                            <span>Filters</span>
                                                        </div>
                                                        <div class="controller-item__children">
                                                            <Button
                                                                size="small"
                                                                type="link"
                                                                onclick={() => this.newFilter(null)}>
                                                                <Icon type="plus" /> Add filters
                                                            </Button>
                                                            <p class="controller-item--desc">Click add button to add filters</p>
                                                        </div>
                                                    </li>
                                            }

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


                    {/* Clean */}
                    {
                        this.hiddenFields.groups ? null :
                            <div class="controller-group">
                                <h3 class="controller-group__title">Files Clean</h3>
                                <ul class="controller-group__wrapper">

                                    <li class="controller-item">
                                        <div class="controller-item__label">
                                            <span>Cache</span>
                                        </div>
                                        <div class="controller-item__children">
                                            <Button size="small" onclick={this.cleanCacheHandler}>clean</Button>
                                            <Checkbox vModel={this.cacheOptions.mock}>include mocked cache files</Checkbox>
                                            <p class="controller-item--desc">Cached files will be removed</p>
                                        </div>
                                    </li>

                                    <li class="controller-item">
                                        <div class="controller-item__label">
                                            <span>Mock</span>
                                        </div>
                                        <div class="controller-item__children">
                                            <Button size="small" onclick={this.cleanMockHandler}>clean</Button>
                                            <p class="controller-item--desc">Mocked files will be removed</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                    }

                    {/* Store */}
                    {
                        this.hiddenFields.groups ? null :
                            <div class="controller-group">
                                <h3 class="controller-group__title">Files Store</h3>
                                <ul class="controller-group__wrapper">

                                    <li class="controller-item">
                                        <div class="controller-item__label">
                                            <span>Cache</span>
                                        </div>
                                        <div class="controller-item__children">
                                            <div class="button-with-input">
                                                <Button size="small" onclick={this.storeCacheHandler}>store</Button>
                                                <Input size="small"
                                                    placeholder="Input store name"
                                                    vModel={this.storeNames.cache} />
                                            </div>
                                            <p class="controller-item--desc">Cached files will be stored {this.storeNames.cache ? `into ${this.storeNames.cache}` : ''}</p>
                                        </div>
                                    </li>

                                    <li class="controller-item">
                                        <div class="controller-item__label">
                                            <span>Mock</span>
                                        </div>
                                        <div class="controller-item__children">
                                            <div class="button-with-input">
                                                <Button size="small" onclick={this.storeMockHandler}>store</Button>
                                                <Input size="small"
                                                    placeholder="Input store name"
                                                    vModel={this.storeNames.mock} />
                                            </div>
                                            <p class="controller-item--desc">Cached files will be stored {this.storeNames.mock ? `into ${this.storeNames.mock}` : ''}</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                    }

                    <div class="controller-item--hidden-indicator" onclick={() => this.hiddenFields.groups = !this.hiddenFields.groups}>
                        <div class={{ 'up': !this.hiddenFields.groups }}>
                            <ArrowDownIcon />
                        </div>
                    </div>

                </div>
            </div >
        );
    },
    data() {
        return {
            // loadings
            sync: {
                loading: false,
                error: null
            },
            upload: {
                loading: false,
                error: null
            },

            fastMaxAgeSwitcher: 0,
            hiddenFields: {
                cache: true,
                groups: true,
            },

            // states
            cache: {
                enable: true,
                maxAgeNumber: 0,
                maxAgeUnit: 'seconds',
                contentType: ["application/json"],
                filters: []
            },
            mock: {
                enable: true,
                prefix: ''
            },
            cacheOptions: {
                mock: false
            },
            storeNames: {
                cache: '',
                mock: ''
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
    created() {
        this.syncConfig();
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
                when: 'response',
                where: 'status',
                field: '',
                value: 200,
                applyRoute: '*',
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
            this.sync.loading = true;
            try {
                const { cache, mock } = await request.sync();
                this.cache = cache;
                this.mock = mock;
                this.cacheMaxAgeNumberChange(this.cache.maxAgeNumber);
                this.sync.error = false;
            } catch (error) {
                this.sync.error = true;
                console.log('[Plugin Cache UI switcher]: sync error: ', error);
                console.error('error: ', error);
            } finally {
                this.sync.loading = false;
            }
        },

        async uploadConfig() {
            this.upload.loading = true;
            try {
                await request.upload({
                    cache: { ...this.cache },
                    mock: { ...this.mock },
                });
                this.upload.error = false;
            } catch (error) {
                this.upload.error = true;
                console.log('[Plugin Cache UI switcher]: save config error: ', error);
                console.error('error: ', error);
            } finally {
                this.upload.loading = false;
            }
        },

        async reloadServer() {
            await request.reload();
        },

        async cleanCacheHandler() {
            await request.cleanFiles({
                target: 'cache',
                options: this.cacheOptions
            });
        },
        async cleanMockHandler() {
            await request.cleanFiles({
                target: 'mock'
            });
        },
        async storeCacheHandler() {
            await request.storeFiles({
                target: 'cache',
                name: this.storeNames.cache
            });
        },
        async storeMockHandler() {
            await request.storeFiles({
                target: 'mock',
                name: this.storeNames.mock
            });
        },
    }
}