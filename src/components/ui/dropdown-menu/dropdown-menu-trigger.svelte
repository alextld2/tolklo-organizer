<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof DropdownMenuPrimitive.Trigger>;
  let { children, class: className, ...rest }: Props = $props();
</script>

<DropdownMenuPrimitive.Trigger class={className} {...rest}>
  {@render children?.()}
</DropdownMenuPrimitive.Trigger>
