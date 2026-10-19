<template>
	<div><component :is="dynamicComponent"/></div>
</template>
<script>
import { defineAsyncComponent } from "vue";

export default {
	computed: {
		dynamicComponent() {
			return defineAsyncComponent(() => import("./_includes/child.vue"));
		}
	}
}
</script>
