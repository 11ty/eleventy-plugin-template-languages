<script>
import { getContext } from "svelte";
let { letter } = $props();
const data = getContext("data");
let val = $derived(await Promise.resolve(letter.toUpperCase()));
</script>
<p>{val} {data.eleventy.generator}</p>
