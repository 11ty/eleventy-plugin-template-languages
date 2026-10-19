<script>
import { getContext } from "svelte";
const site = getContext("site");
</script>
<p>{site.url}</p>
