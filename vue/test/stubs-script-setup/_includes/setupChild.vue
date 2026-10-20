<template>
	<p id="setup-child">{{ greeting }} {{ shouty }}</p>
</template>
<style scoped>
#setup-child { color: teal; }
</style>
<script setup>
import { computed } from "vue";

const props = defineProps({
	greeting: { type: String, default: "hi" },
});

const shouty = computed(() => props.greeting.toLowerCase() + "!");
</script>
