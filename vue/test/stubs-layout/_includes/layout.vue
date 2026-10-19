<template>
	<main :data-title="title" v-html="content"></main>
</template>
<style>
main { color: rebeccapurple; }
</style>
<script>
export default {
	data: function() {
		return {
			layout: "base.njk",
		};
	},
}
</script>
