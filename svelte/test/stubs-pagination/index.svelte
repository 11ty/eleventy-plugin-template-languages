<script module>
export const data = {
	items: ["a", "b", "c", "d"],
	pagination: {
		data: "items",
		size: 2,
	},
	permalink: data => `/page-${data.pagination.pageNumber}/`,
};
</script>
<script>
let { pagination } = $props();
</script>
<ul>{#each pagination.items as item}<li>{item}</li>{/each}</ul>
