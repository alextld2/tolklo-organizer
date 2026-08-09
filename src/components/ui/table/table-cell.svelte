<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLTdAttributes } from "svelte/elements";

  type Props = HTMLTdAttributes & { class?: string };
  let { children, class: className, ...rest }: Props = $props();
</script>

<td
  class={cn(
    "px-6 py-4.5 align-middle text-xs font-semibold text-[#1A1D21] dark:text-[#EDF0F3] [&:has([role=checkbox])]:pr-0",
    className
  )}
  {...rest}
>
  {@render children?.()}
</td>
