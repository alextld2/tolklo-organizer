<script lang="ts">
  import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof ContextMenuPrimitive.GroupHeading> & {
    inset?: boolean;
  };
  let { children, class: className, inset = false, ...rest }: Props = $props();
</script>

<ContextMenuPrimitive.GroupHeading
  class={cn(
    "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500",
    inset && "pl-8",
    className
  )}
  {...rest}
>
  {@render children?.()}
</ContextMenuPrimitive.GroupHeading>
