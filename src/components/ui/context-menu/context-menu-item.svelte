<script lang="ts">
  import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof ContextMenuPrimitive.Item> & {
    inset?: boolean;
  };
  let { children, class: className, inset = false, onSelect, ...rest }: Props = $props();
</script>

<ContextMenuPrimitive.Item
  class={cn(
    "relative flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold text-[#1A1D21] dark:text-[#EDF0F3] outline-none transition-colors hover:bg-gray-100/80 dark:hover:bg-gray-800/60 focus:bg-gray-100/80 dark:focus:bg-gray-800/60 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    inset && "pl-8",
    className
  )}
  {onSelect}
  {...rest}
>
  {@render children?.()}
</ContextMenuPrimitive.Item>
