<template>
	<ul><li v-for="item in pagination.items" :key="item">{{ item }}</li></ul>
</template>
<script>
export default {
	data() {
		return {
			items: ["a", "b", "c", "d"],
			pagination: {
				data: "items",
				size: 2
			},
			permalink: data => `/page-${data.pagination.pageNumber}/`
		};
	}
}
</script>
