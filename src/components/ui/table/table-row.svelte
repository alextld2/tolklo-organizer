<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLTableRowAttributes } from "svelte/elements";

  type Props = HTMLTableRowAttributes & { class?: string };
  let { children, class: className, ...rest }: Props = $props();
</script>

<tr
  class={cn(
    "group hover:bg-gray-50/40 dark:hover:bg-[#1E2228]/30 transition-colors border-b border-gray-100 dark:border-[#232830]/40 data-[state=selected]:bg-muted",
    className
  )}
  {...rest}
>
  {@render children?.()}
</tr>
