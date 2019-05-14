<template>
	<code class="raw-data-viewer">
		<div class="raw-data-json" v-if="data.type.match(/json/)">
			{{ data.rawData }}
		</div>
		<div :class="`raw-data-${data.type}`" v-else>
			{{ spittedData }}
			<span v-if="data.rawData.length > maxLength">
				... <span class="tip">total size {{ data.size | unitFormat('size') }} </span>
				<span class="tip cursor-pointer load-more"
				      @click="maxLength += 1000">load more</span>
			</span>
		</div>
	</code>
</template>

<script>
export default {
	name: "RawDataViewer",
	props: {
		data: Object
	},
	data() {
		return {
			maxLength: 2000
		};
	},
	computed: {
		spittedData() {
			return this.data.rawData.substr(0, this.maxLength);
		}
	}
};
</script>

<style lang="scss">
.raw-data-viewer {
	.tip {
		background: aliceblue;
		padding: 4px 10px;
		border-radius: 5px;
	}
	.load-more {
		margin-left: 5px;
		&:hover {
			background: rgb(218, 235, 250);
		}
	}
}
</style>
