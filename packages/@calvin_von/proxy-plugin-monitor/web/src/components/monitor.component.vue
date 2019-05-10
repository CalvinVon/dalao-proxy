<template>
	<div class="monitor">
		<div class="monitor-header">
			<div class="flex flex-item-center flex-content-between">
				<h3>Request Monitor</h3>

				<status :status="ws_connected"
				        @connect="connect"></status>
			</div>
			<div class="request-filter flex flex-item-center">
				<a-input v-model="textFilter"
				         @change="textFilterChange"
				         placeholder="Filter"></a-input>

				<filter-tab :filters="typeFilters"
				            @active="typeFilterChange"></filter-tab>
			</div>
		</div>
		<a-table :columns="columns"
		         :dataSource="monitorData"
		         :pagination="false"
		         bordered>

			<!-- Name -->
			<div slot="Name"
			     slot-scope="text">
				<p>{{ text.suffix }}</p>
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
					{{ record.data.response.size | unitFormat('size') }}
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
	</div>
</template>

<script>
import Status from "./monitor/status.component";
import FilterTab from "./monitor/filter-tab.component";
const env = process.env.NODE_ENV;
const customRenderer = field => ({
	scopedSlots: {
		customRender: field
	}
});
const typeFilters = ["All", "JS", "CSS", "Img", "Media", "Doc", "Other"];
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
		title: "Size",
		dataIndex: "data",
		key: "Size",
		...customRenderer("Size")
	},
	{
		title: "Time",
		dataIndex: "Timing",
		key: "Time",
		...customRenderer("Time")
	},
	{
		title: "Hit Cache",
		dataIndex: "type",
		key: "Hit Cache",
		...customRenderer("Hit Cache")
	}
];

export default {
	name: "monitor-component",
	data() {
		return {
			ws: null,
			ws_connected: false,

			textFilter: "",
			typeFilter: "",
			typeFilters,

			columns,
			monitorData: []
		};
	},
	components: {
		Status,
		FilterTab
	},
	created() {
		this.connect();
	},
	filters: {
		// whether the request hit cache
		whetherHitCache(value) {
			return value === "hitCache" ? true : false;
		},
		// formart size unit
		unitFormat(value, type) {
			const UNITS = {
				size: ["B", "KB", "MB", "GB", "TB"],
				time: ["ms", "s"]
			}[type];

			let level = 0;
			while (value >= 1000) {
				if (level === UNITS.length) break;
				value /= 1000;
				level++;
			}
			return (
				(/\./.test(String(value)) ? Number(value).toFixed(2) : value) +
				UNITS[level]
			);
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
				console.log(ev);
			};
			ws.onmessage = ev => {
				this.receivingData(ev.data);
			};
		},

		// Add data to monitor
		receivingData(rawData) {
			const data = JSON.parse(rawData);
			if (!/(proxy|hitCache)/i.test(data.type)) return;

			let item;
			if ((item = this.getMonitorItemById(data.id))) {
				Object.assign(item, data);
				this.$forceUpdate();
			} else {
				this.monitorData.push(data);
			}
		},

		// Get data item from exsit item list
		getMonitorItemById(id) {
			const res = this.monitorData.filter(item => item.id === id) || [];
			return res[0];
		},

		textFilterChange() {
			this.filterChange(this.textFilter, this.typeFilter);
		},
		typeFilterChange(type) {
			this.typeFilter = type;
			this.filterChange(this.textFilter, this.typeFilter);
        },
        filterChange(text, type) {
            // TODO
        }
	}
};
</script>

<style lang="scss">
.monitor {
	&-header {
		z-index: 999;
		background-color: #fff;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		padding: 20px 20px 10px 20px;
		h3 {
			font-size: 18px;
			font-weight: bold;
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
		.filter-tab {
			margin-left: 5px;
		}
	}

	.ant {
		&-input {
			width: 200px;
		}
		&-table {
			&-wrapper {
				padding-top: 100px;
			}
		}
	}
}
</style>
