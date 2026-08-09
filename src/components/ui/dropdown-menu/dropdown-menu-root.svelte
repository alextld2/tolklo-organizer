<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof DropdownMenuPrimitive.Root>;
  let { children, ...rest }: Props = $props();
</script>

<DropdownMenuPrimitive.Root {...rest}>
  {@render children?.()}
</DropdownMenuPrimitive.Root>
