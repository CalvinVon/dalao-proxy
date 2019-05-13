<template>
    <div class="monitor-detail">
        <a-tabs>
            <a-tab-pane tab="Headers"
                        key="1">
                <!-- General -->
                <detail-block name="General"
                              :detail="detail"></detail-block>
                <!-- General -->

                <!-- Response Headers -->
                <detail-block name="Response Headers"
                              :detail="detail"></detail-block>
                <!-- Response Headers -->

                <!-- Request Headers -->
                <detail-block name="Request Headers"
                              :detail="detail"></detail-block>
                <!-- Request Headers -->

                <!-- Query String Parameters -->
                <detail-block v-if="detail['Query String Parameters']"
                              name="Query String Parameters"
                              :detail="detail"></detail-block>
                <!-- Query String Parameters -->

                <!-- Request Payload -->
                <detail-block v-if="detail['Request Payload']"
                              name="Request Payload"
                              :detail="detail"></detail-block>
                <!-- Request Payload -->
            </a-tab-pane>

            <a-tab-pane tab="Preview"
                        key="2">
                <json-viewer :data="detail.data.response.data"
                             :deep="3"
                             highlightMouseoverNode
                             showLength></json-viewer>
            </a-tab-pane>

            <a-tab-pane tab="Response"
                        key="3">
                <code class="raw-data">
                    {{ detail.data.response.data }}
                </code>
            </a-tab-pane>
        </a-tabs>
    </div>
</template>

<script>
import DetailBlock from "./detail-block.component";
export default {
    name: "monitor-detail",
    props: {
        detail: Object
    },
    components: {
        DetailBlock
    }
};
</script>

<style lang="scss">
.monitor-detail {
    background-color: #fff;
    border-left: 1px solid #e0e0e0;
    &-block {
        padding: 10px;
        border-bottom: 1px solid #e0e0e0;
        &:last-child {
            border-bottom: none;
        }
    }
    .raw-data {
        font-size: 12px;
        color: #333;
        padding: 10px;
    }

    .vjs-tree {
        .vjs {
            &-key {
                color: #880e4f;
            }
            &-value__string {
                color: #b71c1c;
            }
            &-tree {
                &__content {
                    padding-left: 2em;
                }
            }
        }
    }
}
</style>


