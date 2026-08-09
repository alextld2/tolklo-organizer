<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof DropdownMenuPrimitive.SubContent>;
  let { children, class: className, ...rest }: Props = $props();
</script>

<DropdownMenuPrimitive.SubContent
  class={cn(
    "z-50 min-w-[10rem] overflow-hidden rounded-2xl border border-gray-100 dark:border-[#232830] bg-white dark:bg-[#1E2228] p-1.5 text-slate-950 dark:text-slate-50 shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
    className
  )}
  {...rest}
>
  {@render children?.()}
</DropdownMenuPrimitive.SubContent>
