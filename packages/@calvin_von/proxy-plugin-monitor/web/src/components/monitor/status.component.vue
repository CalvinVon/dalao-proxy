<template>
	<div class="connection-status">
		<template v-if="status === 'Connected'">
			<span class="label-connected">Connected</span>
		</template>
		<template v-else-if="status === 'Connecting'">
			<a-spin>
				<a-icon slot="indicator"
				        type="loading"
				        style="font-size: 12px; color: #FF9800"
				        spin />
			</a-spin>
			<span class="label-connecting">Connecting...</span>
		</template>
		<template v-else-if="status === 'Disconnected'">
			<span class="label-disconnected">Disconnected</span>
			<button type="button"
			        class="connect-button"
			        @click="connect">Connect</button>
		</template>
	</div>
</template>
<script>
export default {
	name: "monitor-status",
	props: {
		status: String
	},
	methods: {
		connect() {
			this.$emit("connect");
		}
	}
};
</script>

<style lang="scss">
@import "~@/styles/mixins.scss";
.connection-status {
	.connect-button {
		margin-left: 5px;
		@include button(#2196f3);
	}
}
</style>


