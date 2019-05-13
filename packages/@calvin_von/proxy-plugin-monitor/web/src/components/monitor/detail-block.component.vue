<template>
	<div class="monitor-detail-block">
		<h3 class="block-title"
		    :class="{ 'folded': folded }"
		    @click="folded = !folded">{{ name }}</h3>
		<div class="block-content"
		     v-if="!folded">
			<p class="content-pair"
			   v-for="key in Object.keys(detail[name])"
			   :key="key">
				<span class="pair-key">{{ key }}</span>
				<code class="pair-value">{{ detail[name][key] }}</code>
			</p>
		</div>
	</div>
</template>

<script>
export default {
	name: "monitor-detail-block",
	props: {
		detail: Object,
		name: String
	},
	data() {
		return {
			folded: false
		};
	}
};
</script>

<style lang="scss">
.monitor-detail-block {
	padding: 0 10px;
	.block {
		&-title {
			font-weight: 500;
			font-size: 16px;
			position: relative;
			user-select: none;
			&::before {
				content: "";
				display: inline-block;
				width: 0;
				height: 0;
				border: 5px solid transparent;
				border-top-color: #333;
				margin-right: 5px;
				transform: translate(0px, 2px);
				transform-origin: 5px 4px;
				transition: all 0.2s ease;
			}

			&.folded {
				&::before {
					transform: rotateZ(-90deg);
				}
			}
		}
		&-content {
			padding-left: 20px;
		}
	}

	.content-pair {
		.pair {
			&-key {
				font-weight: 500;
				margin-right: 5px;
				color: #333;
				&::after {
					content: ":";
				}
			}
			&-value {
                color: #424242;
			}
		}
	}
}
</style>


