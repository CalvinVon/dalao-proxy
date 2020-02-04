<template>
    <code class="raw-data-viewer">
        <pre class="raw-data-json"
             v-if="data.type.match(/json/)">{{ data.rawData }}<a-tooltip placement="top">
				<a-icon v-clipboard:copy="data.rawData" type="copy" />
				<template slot="title">
					<span>Copy it!</span>
				</template>
			</a-tooltip>
		</pre>
        <div :class="`raw-data-${data.type}`"
             v-else>{{ spittedData }}<a-tooltip placement="top">
                <a-icon v-clipboard:copy="data.rawData"
                        type="copy" />
                <template slot="title">
                    <span>Copy it!</span>
                </template>
            </a-tooltip>
            <span v-if="data.rawData.length > maxLength">
                ... <span class="tip">total size {{ data.size | unitFormat('size') }} </span>
                <span class="tip cursor-pointer load-more"
                      @click="maxLength += 3000">load more</span>
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

    .anticon-copy {
        position: absolute;
        right: 4px;
        top: 48px;
        padding: 8px;
        background: rgba(240, 248, 255, 0.6);
        cursor: pointer;
        &:hover {
            color: #2196f3;
            background: #e1f5fe;
            border-radius: 4px;
        }
    }
}
</style>
