<script lang="ts">
  import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof ContextMenuPrimitive.Root>;
  let { children, ...rest }: Props = $props();
</script>

<ContextMenuPrimitive.Root {...rest}>
  {@render children?.()}
</ContextMenuPrimitive.Root>
