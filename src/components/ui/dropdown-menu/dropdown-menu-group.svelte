<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof DropdownMenuPrimitive.Group>;
  let { children, class: className, ...rest }: Props = $props();
</script>

<DropdownMenuPrimitive.Group class={cn(className)} {...rest}>
  {@render children?.()}
</DropdownMenuPrimitive.Group>
