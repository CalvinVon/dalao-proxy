<template>
    <div class="monitor-detail">
        <a-tabs v-model="activeTab">
            <a-tab-pane tab="Headers"
                        class="pane-header"
                        key="1">
                <!-- General -->
                <detail-block name="General"
                              :detail="detail"
                              @change-tab="idx => activeTab = idx"></detail-block>
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

            <a-tab-pane tab="Proxy"
                        class="pane-preview"
                        key="2">

                <!-- Proxy Detail -->
                <detail-block name="Proxy"
                              :detail="detail"></detail-block>
                <!-- Proxy Detail -->

                <detail-block name="Cache"
                              v-if="isCached"
                              alias="Cache Info"
                              :detail="detail"></detail-block>

                <!-- Proxy Response Headers -->
                <detail-block name="Proxy Response Headers"
                              alias="Response Headers"
                              :detail="detail"></detail-block>
                <!-- Proxy Response Headers -->

                <!-- Proxy Request Headers -->
                <detail-block name="Proxy Request Headers"
                              alias="Request Headers"
                              :detail="detail"></detail-block>
                <!-- Proxy Request Headers -->

                <!-- Query String Parameters -->
                <detail-block v-if="detail['Proxy Query String Parameters']"
                              name="Proxy Query String Parameters"
                              alias="Query String Parameters"
                              :detail="detail"></detail-block>
                <!-- Query String Parameters -->

                <!-- Request Payload -->
                <detail-block v-if="detail['Proxy Request Payload']"
                              name="Proxy Request Payload"
                              alias="Request Payload"
                              :detail="detail"></detail-block>
                <!-- Request Payload -->

            </a-tab-pane>

            <a-tab-pane tab="Preview"
                        class="pane-preview"
                        v-if="isPending || isError || canPreview"
                        key="3">

                <template v-if="isPending">
                    <div class="not-available flex flex-center flex-column">
                        <h3>Preview not available</h3>
                        <p>Request not finished yet.</p>
                    </div>
                </template>
                <template v-else-if="isError">
                    <div class="not-available flex flex-center flex-column">
                        <h3>Preview not available</h3>
                        <p>{{ detail['General']['Method'] }} <a :href="`http://${isError.address}:${isError.port}`">{{ isError.address }}:{{ isError.port }}</a> failed with code {{ isError.code }}.</p>
                    </div>
                </template>
                <template v-else>
                    <template v-if="detail.data.response && detail.data.response.type.match(/json/)">
                        <json-viewer :data="detail.data.response.data"
                                     :deep="3"
                                     highlightMouseoverNode
                                     showLength>
                        </json-viewer>
                    </template>
                    <template v-else>
                        <code-viewer :data="detail.data.response"></code-viewer>
                    </template>
                </template>
            </a-tab-pane>

            <a-tab-pane tab="Response"
                        class="pane-response"
                        key="4">
                <template v-if="isPending">
                    <div class="not-available flex flex-center flex-column">
                        <h3>Response not available</h3>
                        <p>Request not finished yet.</p>
                    </div>
                </template>
                <template v-else-if="isError">
                    <div class="not-available flex flex-center flex-column">
                        <h3>Response not available</h3>
                        <p>{{ detail['General']['Method'] }} <a :href="`http://${isError.address}:${isError.port}`">{{ isError.address }}:{{ isError.port }}</a> failed with code {{ isError.code }}.</p>
                    </div>
                </template>
                <template v-else-if="is_304">
                    <div class="not-available flex flex-center flex-column">
                        <h3>Response is empty</h3>
                        <p>Response status is {{ detail['General']['Status Code'] }}, no response message returned.</p>
                    </div>
                </template>
                <template v-else>
                    <raw-data-viewer :data="detail.data.response"></raw-data-viewer>
                </template>
            </a-tab-pane>
        </a-tabs>

        <div class="close"
             @click="$emit('close')"></div>
    </div>
</template>

<script>
import DetailBlock from "./detail-block.component";
import CodeViewer from "./code-viewer.component";
import RawDataViewer from "./raw-data-viewer.component";
export default {
    name: "monitor-detail",
    props: {
        detail: Object
    },
    data() {
        return {
            activeTab: "1"
        };
    },
    components: {
        DetailBlock,
        CodeViewer,
        RawDataViewer
    },
    computed: {
        isCached() {
            return !!this.detail.Cache;
        },
        isPending() {
            return /pending/i.test(this.detail.status);
        },
        isError() {
            return this.detail.data.error;
        },
        is_304() {
            return this.detail.status.code === 304;
        },
        canPreview() {
            return (
                this.detail.data.response &&
                this.detail.data.response.type &&
                this.detail.data.response.type.match(/(json|javascript|html)/)
            );
        }
    }
};
</script>

<style lang="scss">
.monitor-detail {
    position: relative;
    height: 100%;
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

    .ant-tabs {
        height: 100%;
        &-content {
            height: 100%;
            height: calc(100% - 44px);
        }
        &-tabpane {
            overflow-y: auto;
        }
    }

    .close {
        position: absolute;
        top: 0;
        right: 0;
        margin: 10px 15px;
        width: 15px;
        height: 15px;
        z-index: 99;
        cursor: pointer;
        &::before,
        &::after {
            position: absolute;
            content: "";
            display: block;
            height: 15px;
            width: 2px;
            border-radius: 2px;
            background-color: #1565c0;
        }
        &::before {
            transform: translateX(5px) rotateZ(45deg);
        }
        &::after {
            transform: translateX(5px) rotateZ(-45deg);
        }
    }
    .pane {
        &-response,
        &-preview {
            padding: 10px;

            .not-available {
                height: 100%;
                text-align: center;
                h3 {
                    font-size: 18px;
                }
            }
        }
    }
}
</style>


