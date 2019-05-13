<template>
    <div class="monitor-detail">
        <a-tabs>
            <a-tab-pane tab="Headers" key="1">
                <!-- General -->
                <detail-block name="General" :detail="detail"></detail-block>
                <!-- General -->

                <!-- Response Headers -->
                <detail-block name="Response Headers" :detail="detail"></detail-block>
                <!-- Response Headers -->

                <!-- Request Headers -->
                <detail-block name="Request Headers" :detail="detail"></detail-block>
                <!-- Request Headers -->

                <!-- Query String Parameters -->
                <detail-block v-if="detail['Query String Parameters']" name="Query String Parameters" :detail="detail"></detail-block>
                <!-- Query String Parameters -->

                <!-- Request Payload -->
                <detail-block v-if="detail['Request Payload']" name="Request Payload" :detail="detail"></detail-block>
                <!-- Request Payload -->
            </a-tab-pane>
            <a-tab-pane tab="Preview" key="2"></a-tab-pane>
            <a-tab-pane tab="Response" key="3"></a-tab-pane>
        </a-tabs>
    </div>
</template>

<script>
import DetailBlock from "./detail-block.component";
export default {
    name: 'monitor-detail',
    props: {
        detail: Object
    },
    components: {
        DetailBlock
    }
}
</script>

<style lang="scss">
.monitor-detail {
    background-color: #fff;
    border-left: 1px solid #e0e0e0;
    &-block {
        padding-bottom: 5px;
        border-bottom: 1px solid #e0e0e0;
        &+& {
            margin-top: 10px;
        }
    }
}
</style>


