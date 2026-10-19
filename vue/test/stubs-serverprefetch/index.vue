<template>
	<div><item v-for="letter in letters" :key="letter" :letter="letter"/></div>
</template>
<script>
import item from "./_includes/item.vue";

export default {
	data() {
		return {
			letters: ["a", "b", "c"]
		};
	},
	components: {
		item
	}
}
</script>
