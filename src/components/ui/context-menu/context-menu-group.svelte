<script lang="ts">
  import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof ContextMenuPrimitive.Group>;
  let { children, ...rest }: Props = $props();
</script>

<ContextMenuPrimitive.Group {...rest}>
  {@render children?.()}
</ContextMenuPrimitive.Group>
