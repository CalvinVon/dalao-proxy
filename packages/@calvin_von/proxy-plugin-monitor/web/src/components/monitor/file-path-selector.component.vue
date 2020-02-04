<template>
    <div class="file-path-selector">
        <a-spin :spinning="loading">
            <ul>
                <li v-if="path">
                    <div class="list-item folder-item"
                         @click="requestFileList(path, true)">
                        <a-icon type="left-circle" />
                        <span class="file-name">{{ path }}</span>
                        <a-icon type="caret-right" />
                    </div>
                </li>
                <li v-for="file in list"
                    :key="file.name + file.isDir">
                    <div v-if="!file.isDir"
                         class="list-item file-item">
                        <a-icon type="file"
                                theme="filled" />
                        <span class="file-name">{{ file.name }}</span>
                    </div>
                    <div v-else
                         class="list-item folder-item"
                         :class="{ 'is-hide': /^\./.test(file.name) }"
                         @click="requestFileList(file.name)">
                        <a-icon type="folder"
                                theme="filled" />
                        <span class="file-name">{{ file.name }}</span>
                        <a-icon type="caret-right" />
                    </div>
                </li>
            </ul>
        </a-spin>
    </div>
</template>

<script>
import wsConnector from "../../plugins/ws-connector";

export default {
    name: "file-path-selector",
    data() {
        return {
            path: "",
            list: [],
            loading: false
        };
    },
    created() {
        this.requestFileList();
    },
    methods: {
        async requestFileList(dirname, isBackward) {
            this.loading = true;
            const { value } = await wsConnector.send({
                type: "file-system",
                value: {
                    path: this.path,
                    isForward: isBackward ? !isBackward : dirname ? true : null,
                    forwardDirname: dirname
                }
            });
            this.loading = false;
            this.path = value.path;
            this.list = value.list;
        }
    }
};
</script>

<style lang="scss">
.file-path-selector {
    min-height: 400px;
    max-height: 400px;
    overflow-y: auto;
    .anticon-folder {
        color: #8bc34a;
        font-size: 16px;
    }
    .anticon-file {
        color: #2196f3;
        font-size: 16px;
    }

    .list-item {
        margin: 4px;
        padding: 0 8px;
        &.is-hide {
            opacity: 0.6;
        }
        &:hover {
            background: #f5f5f5;
        }

        &.folder-item {
            cursor: pointer;
            .anticon-caret-right {
                float: right;
                line-height: 25px;
            }
        }
    }

    .file-name {
        margin-left: 8px;
    }

    .ant-spin-nested-loading {
        min-height: 400px;
    }
}
</style>