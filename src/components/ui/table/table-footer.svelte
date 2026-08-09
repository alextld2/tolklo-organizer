<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLTableSectionElement> & { class?: string };
  let { children, class: className, ...rest }: Props = $props();
</script>

<tfoot
  class={cn(
    "border-t border-gray-100 dark:border-[#232830] bg-muted/50 font-medium [&>tr]:last-child:border-b-0",
    className
  )}
  {...rest}
>
  {@render children?.()}
</tfoot>
