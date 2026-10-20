<template>
	<div>
		<p v-html="page.url"></p>
		<setupChild greeting="HELLO" />
	</div>
</template>
<style>
body {
	background-color: rebeccapurple;
}
</style>
<script>
import setupChild from "./_includes/setupChild.vue";

export default {
	data: () => {
		return {
			test: "HELLO",
		};
	},
	components: {
		setupChild,
	},
};
</script>
