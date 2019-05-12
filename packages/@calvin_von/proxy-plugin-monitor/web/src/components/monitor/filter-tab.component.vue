<template>
    <div class="filter-tab"
         :class="{ 'multiple': multiple }">
		
		<span class="tab-label">{{ label }}</span>
        <span v-for="(filter, i) in filters"
              class="tab"
              :class="{
				  'active': contidition(i),
			  }"
              @click="activeFilter(i)"
              :key="filter">{{ filter }}</span>
    </div>
</template>

<script>
export default {
    name: "filter-tab",
    props: {
		label: String,
        filters: Array,
        multiple: Boolean
    },
    data() {
        return {
            index: 0,
            // when multiple
            activeIndexs: new Array(this.filters.length)
        };
    },
    watch: {
        filters() {
            this.activeIndexs = new Array(this.filters.length);
            this.activeIndexs[0] = true;
        }
    },
    created() {
        this.activeIndexs[0] = true;
    },
    methods: {
        // dynamic judge
        contidition(i) {
            if (this.multiple) {
                return this.activeIndexs[i];
            } else {
                return this.index === i;
            }
		},
        activeFilter(i) {
            if (this.multiple) {
                const firstVal = this.activeIndexs[0];
                const targetVal = this.activeIndexs[i];

                if (i === 0) {
                    if (!firstVal) {
                        this.activeIndexs = [true].concat(
                            new Array(this.filters.length - 1).fill(false)
                        );
                    }
                } else {
                    if (targetVal) {
                        if (this.activeIndexs.filter(item => item).length > 1) {
                            this.$set(this.activeIndexs, i, !targetVal);
                        }
                    } else {
                        this.$set(this.activeIndexs, i, !targetVal);
                        this.activeIndexs[0] = false;
                    }
                }
                this.$emit(
                    "active",
                    this.activeIndexs
                        .map((it, idx) => {
                            if (it) {
                                return this.filters[idx];
                            }
                            else {
                                return null;
                            }
                        })
                        .filter(it => it)
                );
            } else {
                this.index = i;
                this.$emit("active", this.filters[i], i);
            }
        }
    }
};
</script>

<style lang="scss">
.filter-tab {
	.tab-label {
		position: relative;
		padding: 5px 10px;
		font-weight: bold;
		color: #dbdbdb;
		user-select: none;
		&::before {
			content: "";
			display: block;
			position: absolute;
			left: 0;
			top: 6px;
			width: 4px;
			height: 60%;
			background-color: #EEEEEE;
		}
	}
    .tab {
        padding: 5px 10px;
		margin: 0 1px;
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

