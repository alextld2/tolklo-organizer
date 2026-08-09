<script lang="ts">
  import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof ContextMenuPrimitive.Sub>;
  let { children, ...rest }: Props = $props();
</script>

<ContextMenuPrimitive.Sub {...rest}>
  {@render children?.()}
</ContextMenuPrimitive.Sub>
