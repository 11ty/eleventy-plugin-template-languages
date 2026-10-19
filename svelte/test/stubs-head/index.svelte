<script module>
export const data = { layout: "base.njk" };
</script>
<script>
import { getContext } from "svelte";
const { url } = getContext("functions");
</script>
<svelte:head><meta name="description" content="Svelte"></svelte:head>
<a href={url("/about/")}>About</a>
