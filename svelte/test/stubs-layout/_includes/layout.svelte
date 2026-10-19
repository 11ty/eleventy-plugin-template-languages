<script module>
export const data = {
	layout: "base.njk",
};
</script>
<script>
let { title, content } = $props();
</script>
<main data-title={title}>{@html content}</main>
<style>
main { color: rebeccapurple; }
</style>
