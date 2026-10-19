<script>
import Item from "./_includes/item.svelte";
let letters = ["a", "b", "c"];
</script>
<div>{#each letters as letter}<Item {letter} />{/each}</div>
