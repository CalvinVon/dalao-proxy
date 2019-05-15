<template>
	<monitor></monitor>
</template>

<script>
import zh_CN from "ant-design-vue/lib/locale-provider/zh_CN";
import monitor from "./components/monitor.component";

export default {
	name: "app",
	data() {
		return {
			zh_CN
		};
	},
	components: {
		monitor
	}
};
</script>

<style>
#app {
	font-family: "Avenir", Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}
</style>
