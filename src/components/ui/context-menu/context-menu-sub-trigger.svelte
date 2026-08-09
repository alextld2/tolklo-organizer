<script lang="ts">
  import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof ContextMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  };
  let { children, class: className, inset = false, ...rest }: Props = $props();
</script>

<ContextMenuPrimitive.SubTrigger
  class={cn(
    "flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold text-[#1A1D21] dark:text-[#EDF0F3] outline-none hover:bg-gray-100/80 dark:hover:bg-gray-800/60 focus:bg-gray-100/80 dark:focus:bg-gray-800/60 data-[state=open]:bg-gray-100/80 dark:data-[state=open]:bg-gray-800/60",
    inset && "pl-8",
    className
  )}
  {...rest}
>
  {@render children?.()}
</ContextMenuPrimitive.SubTrigger>
