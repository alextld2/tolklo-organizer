<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  };
  let { children, class: className, inset = false, ...rest }: Props = $props();
</script>

<DropdownMenuPrimitive.SubTrigger
  class={cn(
    "flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-[11px] font-semibold text-[#1A1D21] dark:text-[#EDF0F3] outline-none hover:bg-gray-50 dark:hover:bg-gray-800/60 focus:bg-gray-50 dark:focus:bg-gray-800/60 data-[state=open]:bg-gray-50 dark:data-[state=open]:bg-gray-800/60",
    inset && "pl-8",
    className
  )}
  {...rest}
>
  {@render children?.()}
</DropdownMenuPrimitive.SubTrigger>
