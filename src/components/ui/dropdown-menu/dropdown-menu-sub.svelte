<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof DropdownMenuPrimitive.Sub>;
  let { children, ...rest }: Props = $props();
</script>

<DropdownMenuPrimitive.Sub {...rest}>
  {@render children?.()}
</DropdownMenuPrimitive.Sub>
