<template>
    <div class="code-viewer">
        <template v-if="loading || loadError">
            <div class="loading flex flex-item-center flex-content-center">
                <span v-if="loading">Loading Preview...</span>
                <div class="error-tip"
                     v-else>
                    <h3>Loading Preview Error</h3>
                    <p>{{ loadError }}</p>
                </div>
            </div>
        </template>
        <template v-else>
            <code>
                <pre v-html="spittedHTML"></pre>
            </code>
            <span v-if="data.rawData.length > maxLength">
                ... <span class="tip">total size {{ data.size | unitFormat('size') }} </span>
                <span class="tip cursor-pointer load-more"
                      @click="maxLength += 4000">load more</span>
            </span>
        </template>
    </div>
</template>

<script>
import PreviewWorker from "@/workers/code-preview.worker.js";
import "highlight.js/styles/github.css";
export default {
    name: "CodeViewer",
    props: {
        data: Object
    },
    data() {
        return {
            loading: true,
            loadError: null,
            maxLength: 4000,
            parsedHTML: ""
        };
    },
    computed: {
        spittedHTML() {
            return this.parsedHTML.substr(0, this.maxLength);
        }
    },
    watch: {
        data() {
            this.loadPreview();
        }
    },
    mounted() {
        this.loadPreview();
    },
    methods: {
        loadPreview() {
            const worker = new PreviewWorker();
            worker.onmessage = event => {
                this.loading = false;
                this.parsedHTML = event.data;
            };
            worker.onerror = ev => {
                this.loading = false;
                this.loadError = ev.message;
            };
            worker.postMessage(this.data);
        }
    }
};
</script>

<style lang="scss">
.code-viewer {
    height: 100%;
    .loading {
        height: 100%;
    }
    .error-tip {
        h3 {
            font-size: 18px;
        }
    }
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


