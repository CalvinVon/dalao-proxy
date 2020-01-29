<template>
    <div class="monitor">
        <div class="monitor-header">
            <div class="flex flex-item-center flex-content-between">
                <div>
                    <h3>Request Monitor</h3>
                    Proxy server running on the <a :href="serverAddress">{{ serverAddress }}</a>
                </div>

                <status :status="ws_connected"
                        @connect="connect"></status>
            </div>

            <div class="request-filter flex flex-content-between">
                <a-input v-model="textFilter"
                         class="textFilter"
                         placeholder="Filter ( Regular Expression supported )"></a-input>

                <button class="btn-clear"
                        @click="clearAllData">Clear Requests</button>
            </div>
            <div class="request-filter flex">
                <div class="filters flex flex-wrap">
                    <filter-tab label="Content"
                                :filters="TYPE_FILTERS.map(it => it.name)"
                                @active="typeFilterChange"></filter-tab>

                    <filter-tab label="Status"
                                :filters="STATUS_FILTERS"
                                multiple
                                @active="statusFilterChange"></filter-tab>

                    <filter-tab label="Cached"
                                :filters="CACHE_FILTERS.map(it => it.name)"
                                @active="cacheFilterChange"></filter-tab>
                </div>
            </div>
        </div>

        <div class="monitor-content flex">
            <a-table :columns="columns"
                     :dataSource="filteredData"
                     :pagination="false"
                     :rowClassName="rowClassName"
                     :customRow="customRow"
                     rowKey="id"
                     bordered>

                <!-- Name -->
                <div slot="Name"
                     slot-scope="text, record">
                    <p>
                        {{ text.suffix }}
                        <template v-if="record.type === 'hitCache'">
                            <span class="cell-status-hitCache">Hit Cache</span>
                        </template>
                    </p>
                    <span class="text-light">{{ text.prefix }}</span>
                </div>
                <!-- Name -->

                <!-- Status -->
                <template slot="Status"
                          slot-scope="text">
                    <template v-if="is(text, 'String')">
                        {{ text }}
                    </template>
                    <div v-else>
                        <p>{{ text.code }}</p>
                        <span class="text-light">{{ text.message }}</span>
                    </div>
                </template>
                <!-- Status -->

                <!-- Type -->
                <div slot="Type"
                     slot-scope="text, record">
                    <template v-if="record['Response Headers']">
                        {{ record['Response Headers']['content-type'] }}
                    </template>
                    <template v-else>
                        {{ record['Request Headers']['content-type'] }}
                    </template>
                </div>
                <!-- Type -->

                <!-- Size -->
                <template slot="Size"
                          slot-scope="text, record">
                    <template v-if="record['Response Headers']">
                        {{ record.data.response && record.data.response.size || 0 | unitFormat('size') }}
                    </template>
                </template>
                <!-- Size -->

                <!-- Time -->
                <template slot="Time"
                          slot-scope="text">
                    {{ text | unitFormat('time') }}
                </template>
                <!-- Time -->

                <!-- Hit Cache -->
                <template slot="Hit Cache"
                          slot-scope="text">
                    {{ text | whetherHitCache }}
                </template>
                <!-- Hit Cache -->

            </a-table>

            <div class="monitor-detail-wrapper"
                 v-if="detail.id">
                <detail :detail="detail"
                        @close="detail = {}"></detail>
            </div>
        </div>

        <div class="monitor-footer">
            {{ filteredData.length }} / {{ monitorData.length }} requests
            <div class="divider"></div>
            {{ filteredDataSize | unitFormat('size') }} / {{ allDataSize | unitFormat('size') }} transferred
            <div class="divider"></div>
            Timing {{ allDataTime | unitFormat('time') }}

            <span class="float-right">
                <span>@calvin_von/proxy-plugin-monitor </span>
                <a href="https://github.com/CalvinVon/dalao-proxy/tree/master/packages/%40calvin_von/proxy-plugin-monitor">Github</a>
            </span>
        </div>
    </div>
</template>

<script>
import Status from "./monitor/status.component";
import FilterTab from "./monitor/filter-tab.component";
import Detail from "./monitor/detail.component";
const env = process.env.NODE_ENV;
const customRenderer = field => ({
    scopedSlots: {
        customRender: field
    }
});
const TYPE_FILTERS = [
    { name: "All" },
    { name: "XHR", regexp: /(x-www-form-urlencoded|form-data|json)/ },
    { name: "JS", regexp: /(text|application)\/(x-)?(java|ecma)script/ },
    { name: "CSS", regexp: /text\/css/ },
    {
        name: "Img",
        regexp: /(gif|png|jpe?g|bmp|webp|x-icon|vnd\.microsoft\.icon|svg\+xml)/
    },
    { name: "Media", regexp: /(midi|mpeg|webm|ogg|(x-(pn-)?)?wave?)/ },
    { name: "Doc", regexp: /(text\/plain|text\/html)/ },
    {
        name: "Other",
        regexp: /(octet-stream|pkcs12|vnd\.mspowerpoint|xhtml\+xml|xml|pdf)/
    }
];
const STATUS_FILTERS = ["All", "200", "404", "500"];
const CACHE_FILTERS = [
    { name: "All" },
    { name: "Hit", test: item => item.type === "hitCache" },
    { name: "Real", test: item => item.type !== "hitCache" }
];
const columns = [
    {
        title: "Name",
        dataIndex: "name",
        key: "Name",
        ...customRenderer("Name")
    },
    {
        title: "Status",
        dataIndex: "status",
        key: "Status",
        ...customRenderer("Status")
    },
    {
        title: "Type",
        key: "Type",
        ...customRenderer("Type")
    },
    {
        title: "Message Size",
        dataIndex: "data",
        key: "Size",
        ...customRenderer("Size")
    },
    {
        title: "Time",
        dataIndex: "Timing",
        key: "Time",
        ...customRenderer("Time")
    }
    // {
    // 	title: "Hit Cache",
    // 	dataIndex: "type",
    // 	key: "Hit Cache",
    // 	...customRenderer("Hit Cache")
    // }
];

export default {
    name: "monitor-component",
    provide() {
        return {
            getWs: () => this.ws
        };
    },
    data() {
        return {
            serverConfig: {},
            ws: null,
            ws_connected: false,

            textFilter: "",
            typeFilter: TYPE_FILTERS[0],
            statusFilter: [STATUS_FILTERS[0]],
            cacheFilter: CACHE_FILTERS[0],
            TYPE_FILTERS,
            STATUS_FILTERS,
            CACHE_FILTERS,

            columns,
            detail: {},
            monitorData: []
        };
    },
    computed: {
        // monitor data filtering
        filteredData() {
            return this.monitorData.filter(item => {
                const CONDITIONS = [];

                if (this.textFilter) {
                    try {
                        CONDITIONS.push(
                            new RegExp(this.textFilter, "i").test(item.url)
                        );
                    } catch (error) {
                        CONDITIONS.push(
                            item.url.indexOf(this.textFilter) !== -1
                        );
                    }
                }

                if (this.typeFilter.name !== "All") {
                    const type =
                        item["Request Headers"]["content-type"] ||
                        (item["Response Headers"] || {})["content-type"];
                    CONDITIONS.push(this.typeFilter.regexp.test(type));
                }

                if (this.statusFilter[0] !== "All") {
                    const reg = new RegExp(`(${this.statusFilter.join("|")})`);
                    CONDITIONS.push(reg.test(item.status.code));
                }

                if (this.cacheFilter.name !== "All") {
                    CONDITIONS.push(this.cacheFilter.test(item));
                }

                return CONDITIONS.every(it => it);
            });
        },
        filteredDataSize() {
            return this.filteredData.reduce((pre, cur) => {
                if (cur.data.response && cur.data.response.size) {
                    return pre + cur.data.response.size;
                }
                return pre;
            }, 0);
        },
        allDataSize() {
            return this.monitorData.reduce((pre, cur) => {
                if (cur.data.response && cur.data.response.size) {
                    return pre + cur.data.response.size;
                }
                return pre;
            }, 0);
        },
        allDataTime() {
            return this.monitorData.reduce((pre, cur) => {
                if (cur.Timing) {
                    return pre + cur.Timing;
                }
                return pre;
            }, 0);
        },
        serverAddress() {
            return `http://${this.serverConfig.host}:${this.serverConfig.port}`;
        }
    },
    components: {
        Status,
        FilterTab,
        Detail
    },
    created() {
        this.connect();
    },
    filters: {
        // whether the request hit cache
        whetherHitCache(value) {
            return value === "hitCache" ? true : "";
        }
    },
    methods: {
        is(value, type) {
            return Object.prototype.toString.call(value) === `[object ${type}]`;
        },
        // Establish connection
        connect() {
            this.ws_connected = "Connecting";
            if (this.ws) {
                this.ws.close();
            }

            let socketUrl = "ws://" + window.location.host + "/ws";
            if (env !== "production") {
                socketUrl = "ws://localhost:40001/ws";
            }
            const ws = (this.ws = new WebSocket(socketUrl));
            ws.onopen = () => {
                this.ws_connected = "Connected";
            };
            ws.onclose = ev => {
                this.ws_connected = "Disconnected";
                this.$notification.open({
                    key: "onclose",
                    message: "Connection closed.",
                    description:
                        "The connection to the server has been disconnected, check if dalao-proxy still running",
                    onClick: () => {
                        this.$notification.close("onclose");
                    }
                });
            };
            ws.onmessage = ev => {
                this.receivingData(ev.data);
            };
        },

        // Add data to monitor
        receivingData(rawData) {
            const data = JSON.parse(rawData);
            if (/(proxy|hitCache)/i.test(data.type)) {
                let index = this.getMonitorIndexById(data.id);
                if (index !== -1) {
                    const item = this.monitorData[index];
                    Object.assign(data["General"], item["General"]);
                    Object.assign(data["Proxy"], item["Proxy"]);
                    this.$set(
                        this.monitorData,
                        index,
                        Object.assign({}, item, data)
                    );
                } else {
                    this.monitorData.push(data);
                }
            } else if (/config/.test(data.type)) {
                this.serverConfig = data.config;
            } else if (/clean/.test(data.type)) {
                this.monitorData = [];
            }
        },

        // Get data item index from exsit item list
        getMonitorIndexById(id) {
            let targetIndex = -1;
            for (let index = 0; index < this.monitorData.length; index++) {
                const item = this.monitorData[index];
                if (item.id === id) {
                    targetIndex = index;
                    break;
                }
            }
            return targetIndex;
        },

        typeFilterChange(type, index) {
            this.typeFilter = TYPE_FILTERS[index];
        },
        statusFilterChange(status) {
            this.statusFilter = status;
        },
        cacheFilterChange(cache, index) {
            this.cacheFilter = CACHE_FILTERS[index];
        },
        clearAllData() {
            this.monitorData = [];
        },

        rowClassName(row) {
            const classes = [];
            if (row.status.code === 500) {
                classes.push("row-status-500");
            }
            if (row === this.detail) {
                classes.push("row-status-selected");
            }
            return classes;
        },

        customRow(item) {
            return {
                on: {
                    click: () => {
                        this.detail = item;
                    }
                }
            };
        }
    }
};
</script>

<style lang="scss">
@import "~@/styles/mixins.scss";
.monitor {
    display: flex;
    flex-flow: column nowrap;
    height: 100%;

    &-header {
        flex: 0;
        z-index: 999;
        background-color: #fff;
        padding: 20px 20px 10px 20px;
        box-shadow: 0 2px 5px #f5f5f5;
        color: #333;
        h3 {
            font-size: 20px;
            font-weight: 400;
        }
    }

    &-footer {
        flex: 0;
        z-index: 999;
        background-color: #fff;
        border-top: 1px solid #f5f5f5;
        color: #333;
        padding: 5px 20px;
        font-size: 12px;
        .divider {
            display: inline-block;
            width: 1px;
            height: 10px;
            margin: 0 5px;
            background-color: #616161;
            user-select: none;
        }
    }

    &-content {
        position: relative;
        flex: 1;
        overflow-y: hidden;

        .ant-table-wrapper {
            flex: 1;
            overflow-y: hidden;
            overflow-x: hidden;
            &:hover {
                overflow-y: auto;
            }
        }

        .monitor-detail-wrapper {
            width: 50%;
            background: #fff;
            z-index: 999;
            overflow-y: hidden;
            border-top: 1px solid #f5f5f5;
        }

        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
            &-thumb {
                background: #bdbdbd;
                border-radius: 10px;
                box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
            }
            &-track {
                box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.1);
                border-radius: 10px;
                background: #fafafa;
            }
        }
    }
    .label {
        &-connecting {
            color: #ffc107;
        }
        &-disconnected {
            color: #9e9e9e;
        }
        &-connected {
            position: relative;
            color: green;
            &::before {
                content: "";
                width: 6px;
                height: 6px;
                border-radius: 6px;
                background: green;
                position: absolute;
                left: -10px;
                top: 8px;
            }
        }
    }

    .request-filter {
        margin-top: 10px;
        .textFilter {
            width: 300px;
        }
        .filter-tab {
            margin-right: 20px;
        }

        .btn-clear {
            margin-top: 2px;
            @include button(#616161);
        }
    }

    .ant {
        &-input {
            width: 200px;
        }
        &-table {
            &-row {
                cursor: pointer;
            }
            &-thead > tr > th,
            &-tbody > tr > td {
                padding: 10px 16px;
                max-width: 200px;
                word-break: break-all;
            }
        }
        &-tabs {
            &-nav-wrap {
                background: #fafafa;
            }
            &-bar {
                &.ant-tabs-top-bar {
                    margin: 0;
                }
            }
        }
    }

    .row {
        &-status {
            &-selected {
                background-color: #e1f5fe;
            }
            &-500 {
                background: #fafafa;
            }
        }
    }

    .cell {
        &-status {
            &-hitCache {
                font-size: 12px;
                color: #c0ca33;
                border: 1px solid #cddc39;
                border-radius: 4px;
                padding: 1px 4px;
                margin-left: 5px;
            }
        }
    }
}
</style>
