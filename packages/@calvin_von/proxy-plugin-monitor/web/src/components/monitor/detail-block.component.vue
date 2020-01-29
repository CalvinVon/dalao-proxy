<template>
    <div class="monitor-detail-block">
        <h3 class="block-title"
            :class="{ 'folded': folded }"
            @click="folded = !folded">{{ alias || name }}</h3>

        <div class="block-content"
             v-if="!folded">
            <p class="content-pair"
               v-for="key in Object.keys(detail[name] || {})"
               :key="key">

                <template v-if="Array.isArray(detail[name][key])">
                    <p class="content-pair same-pair"
                       v-for="item in detail[name][key]"
                       :key="item">
                        <span class="pair-key">{{ key }}</span>
                        <code class="pair-value">{{ item }}</code>
                    </p>
                </template>

                <template v-else>
                    <span class="pair-key">{{ key }}</span>

                    <template v-if="isCached && /hit cache/i.test(detail[name][key])">
                        <a-tooltip placement="top">
                            <code class="pair-value">{{ detail[name][key] }}</code>

                            <template slot="title">
                                <p class="cache-tooltip">
                                    <span>
                                        Response is cached
                                    </span>
                                </p>
                            </template>
                        </a-tooltip>
                        <a-button @click="$emit('change-tab', '2')">Open in cache tab
                            <a-icon type="link" />
                        </a-button>
                    </template>

                    <template v-else>
                        <code class="pair-value">{{ detail[name][key] }}
                            <a-tooltip placement="top">
                                <a-icon @click="handleOpenFile(detail[name][key])"
                                        v-if="isCached && key.match(/file$/)"
                                        type="link" />

                                <template slot="title">
                                    <span>Open file in editor</span>
                                </template>
                            </a-tooltip>
                        </code>
                    </template>
                </template>

            </p>
        </div>
    </div>
</template>

<script>
export default {
    name: "monitor-detail-block",
    inject: ["getWs"],
    props: {
        detail: Object,
        name: String,
        alias: String
    },
    data() {
        return {
            folded: false
        };
    },
    computed: {
        isCached() {
            return this.detail.type === "hitCache";
        }
    },
    methods: {
        handleOpenFile(filePath) {
            this.getWs().send(
                JSON.stringify({
                    type: "action",
                    action: "open-file",
                    value: filePath
                })
            );
        }
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
        .ant-btn {
            font-size: 12px;
            padding: 0px 4px;
            height: 24px;
            .ant-icon {
                margin: 0;
            }
        }
        &:hover {
            .same-pair {
                .pair-key {
                    background: #ffeb3b;
                    color: #424242;
                }
            }
        }
        .pair {
            &-key {
                font-weight: 600;
                margin-right: 5px;
                color: #616161;
                word-break: break-all;
                padding: 2px;
                padding-left: 0;
                border-radius: 2px;
                &::after {
                    content: ":";
                }
            }
            &-value {
                color: #333;
                word-break: break-all;
                padding: 4px;
                border-radius: 5px;
                &:hover {
                    background: #e1f5fd;
                    transition: all 0.2s ease;
                }

                .anticon {
                    transition: all 0.2s ease;
                    &:hover {
                        cursor: pointer;
                        transform: scale3d(1.2, 1.2, 1);
                    }
                }
            }
        }
    }
}

.ant-tooltip {
    .ant-tooltip-inner {
        .cache-tooltip {
            text-align: center;
        }
    }
}
</style>


