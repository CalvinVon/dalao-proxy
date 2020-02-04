<template>
    <div class="monitor-detail-block">
        <h3 class="block-title"
            :class="{ 'folded': folded }"
            @click="folded = !folded">
            {{ alias || name }}
            <template v-if="showParsedField">
                <span class="title-append"
                      @click.stop="handleToggleParsed">show {{ toggleParsed ? 'raw' : 'parsed' }}</span>
            </template>
        </h3>

        <div class="block-content"
             v-if="!folded">

            <!-- render data fields -->
            <template v-if="(showParsedField && toggleParsed) || !showParsedField">
                <p class="content-pair"
                   v-for="key in Object.keys(targetValue || {})"
                   :key="key">

                    <template v-if="key == 'rawBuffer'"></template>

                    <!-- render pairs if they are same -->
                    <template v-else-if="Array.isArray(targetValue[key])">
                        <p class="content-pair same-pair"
                           v-for="item in targetValue[key]"
                           :key="item">
                            <span class="pair-key">{{ key }}</span>
                            <code class="pair-value">{{ item }}</code>
                        </p>
                    </template>
                    <!-- render pairs if they are same -->

                    <!-- render normal pairs -->
                    <template v-else>
                        <span class="pair-key">{{ key }}</span>

                        <template v-if="isCached && /hit cache/i.test(targetValue[key])">
                            <a-tooltip placement="top">
                                <code class="pair-value">{{ targetValue[key] }}</code>

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
                            <code class="pair-value">{{ targetValue[key] }}

                                <template v-if="isCached && key.match(/^x-cache-file$/)">
                                    <a-tooltip placement="top">
                                        <a-icon @click="handleOpenFile(targetValue[key])"
                                                type="link" />

                                        <template slot="title">
                                            <span>Open file in editor</span>
                                        </template>
                                    </a-tooltip>
                                </template>

                                <template v-else-if="showDownloadField && targetValue[key].match(/^\<File: [^>]+>$/)">
                                    <a-tooltip placement="top">
                                        <a-icon @click="handleDownloadFile(key)"
                                                type="download" />

                                        <template slot="title">
                                            <span>Download this file</span>
                                        </template>
                                    </a-tooltip>
                                </template>
                            </code>
                        </template>
                    </template>
                    <!-- render normal pairs -->

                </p>
            </template>
            <!-- render data fields -->

            <!-- render raw -->
            <template v-else>
                <pre class="content-raw">{{ targetValue }}<a-tooltip placement="top">
                    <a-icon v-clipboard:copy="targetValue" type="copy" />
                    <template slot="title">
                        <span>Copy it!</span>
                    </template>
                </a-tooltip></pre>
            </template>
            <!-- render raw -->
        </div>
    </div>
</template>

<script>
import { Modal } from "ant-design-vue";
import wsConnector from "../../plugins/ws-connector";
import Mount from "vue-mount";
import FilePathSelector from "./file-path-selector.component";

const FileSelectorDialog = {
    name: "FileSelectorDialog",
    props: {
        ...FilePathSelector.props,
        onOk: Function
    },
    data() {
        return {
            visible: false
        };
    },
    render(h) {
        return h(
            Modal,
            {
                props: {
                    title: 'Please select folder to save',
                    width: "80%",
                    visible: this.visible,
                    wrapClassName: "file-selector-dialog",
                    okText: "Select this folder",
                },
                on: {
                    ok: () => {
                        this.onOk(this.$refs.selector);
                        this.visible = false;
                    },
                    cancel: () => {
                        this.visible = false;
                    }
                }
            },
            [
                h(FilePathSelector, {
                    props: this.$props,
                    ref: "selector"
                })
            ]
        );
    }
};

export default {
    name: "monitor-detail-block",
    props: {
        detail: Object,
        name: String,
        alias: String,
        showParsedField: Boolean,
        showDownloadField: Boolean
    },
    data() {
        return {
            folded: false,
            toggleParsed: true
        };
    },
    computed: {
        targetValue() {
            if (this.showParsedField) {
                const field = this.name + (this.toggleParsed ? "[parsed]" : "");
                return this.detail[field];
            } else {
                return this.detail[this.name];
            }
        },
        isCached() {
            return this.detail.type === "hitCache";
        }
    },
    beforeDestroy() {
        if (this.mounter) {
            this.mounter.destroy();
        }
    },
    methods: {
        handleToggleParsed() {
            this.toggleParsed = !this.toggleParsed;
        },

        // 发送打开文件请求
        handleOpenFile(filePath) {
            wsConnector.send({
                type: "action",
                action: "open-file",
                value: filePath
            });
        },

        // 发送下载 formdata 文件请求
        async handleDownloadFile(field) {
            this.openPathSelector(async savePath => {
                const { error } = await wsConnector.send({
                    type: "action",
                    action: "download-file",
                    value: {
                        id: this.detail.id,
                        field,
                        savePath
                    }
                });

                if (error) {
                    this.$notification.error({
                        message: 'Download file error',
                        description: 'Reason: ' + error
                    });
                }
            })
        },

        openPathSelector(callback) {
            const d = {
                props: {
                    onOk: vm => {
                        const savePath = vm.path;
                        callback && callback(savePath);
                    }
                },
                data: {
                    visible: true
                }
            };
            if (this.mounter) {
                this.mounter.set(d);
            } else {
                const mounter = (this.mounter = new Mount(
                    FileSelectorDialog,
                    d
                ));
                mounter.mount();
            }
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

            .title-append {
                font-size: 12px;
                line-height: 16px;
                vertical-align: text-bottom;
                color: #9e9e9e;
                font-weight: 400;
                margin-left: 10px;
                cursor: pointer;
            }
        }
        &-content {
            position: relative;
            padding-left: 20px;
            overflow: auto;

            .content-raw {
                color: #616161;
                font-size: 12px;
                background: #fafafa;
                padding: 10px;
                margin: 8px 0;
                border-radius: 4px;

                .anticon-copy {
                    position: absolute;
                    right: 4px;
                    top: 12px;
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

.file-selector-dialog {
    .ant-modal-content {
        .ant-modal-body {
        }
    }
}
</style>


