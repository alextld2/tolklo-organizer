<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLThAttributes } from "svelte/elements";

  type Props = HTMLThAttributes & { class?: string };
  let { children, class: className, ...rest }: Props = $props();
</script>

<th
  class={cn(
    "px-6 py-4 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-left align-middle [&:has([role=checkbox])]:pr-0",
    className
  )}
  {...rest}
>
  {@render children?.()}
</th>
