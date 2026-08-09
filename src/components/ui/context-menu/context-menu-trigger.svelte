<script lang="ts">
  import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof ContextMenuPrimitive.Trigger>;
  let { children, ...rest }: Props = $props();
</script>

<ContextMenuPrimitive.Trigger {...rest}>
  {@render children?.()}
</ContextMenuPrimitive.Trigger>
