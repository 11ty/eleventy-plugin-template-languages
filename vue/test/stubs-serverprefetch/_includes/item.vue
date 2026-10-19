<template>
	<p>{{ val }} {{ eleventy.generator }} {{ buildawesome.generator }}</p>
</template>
<script>
export default {
	props: ["letter"],
	data() {
		return {
			val: ""
		};
	},
	async serverPrefetch() {
		this.val = await Promise.resolve(this.letter.toUpperCase());
	}
}
</script>
