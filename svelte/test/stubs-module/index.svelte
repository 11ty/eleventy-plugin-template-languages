<script>
import { createCounter } from "./_includes/counter.svelte.js";
const counter = createCounter(3);
</script>
<p>{counter.count}</p>
