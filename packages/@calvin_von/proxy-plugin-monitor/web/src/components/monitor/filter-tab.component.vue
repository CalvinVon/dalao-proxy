<template>
	<div class="filter-tab">
		<span v-for="(filter, i) in filters"
		      class="tab"
		      :class="i === index ? 'active' : ''"
		      @click="activeFilter(i)"
		      :key="filter">{{ filter }}</span>
	</div>
</template>

<script>
export default {
	name: "filter-tab",
	props: {
		filters: Array
	},
	data() {
		return {
			index: 0
		};
	},
	methods: {
		activeFilter(i) {
			this.index = i;
			this.$emit("active", filters[i], i);
		}
	}
};
</script>

<style lang="scss">
.filter-tab {
	.tab {
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        
        &:hover {
            background: #e0e0e0;
            color: white;
        }

		&.active {
            background: #bdbdbd;
            color: white;
		}
	}
}
</style>

