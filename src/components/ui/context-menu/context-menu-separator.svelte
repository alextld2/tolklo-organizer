<script lang="ts">
  import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof ContextMenuPrimitive.Separator>;
  let { class: className, ...rest }: Props = $props();
</script>

<ContextMenuPrimitive.Separator
  class={cn("-mx-1 my-1 h-px bg-gray-100 dark:bg-[#232830]", className)}
  {...rest}
/>
