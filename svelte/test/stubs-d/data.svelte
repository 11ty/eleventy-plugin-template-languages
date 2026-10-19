<script module>
export const data = {
	layout: "layout.njk",
	test: "HELLO",
};
</script>
<script>
import { getContext } from "svelte";
import Child from "./_includes/child.svelte";
let { test } = $props();
const page = getContext("page");
</script>
<div><p>{page.url}</p><p>{test}</p><Child /></div>
<style>
div { background-color: pink; }
</style>
