<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof DropdownMenuPrimitive.Separator>;
  let { class: className, ...rest }: Props = $props();
</script>

<DropdownMenuPrimitive.Separator
  class={cn("-mx-1 my-1 h-px bg-gray-100 dark:bg-[#232830]", className)}
  {...rest}
/>
