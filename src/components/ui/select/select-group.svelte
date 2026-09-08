<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof SelectPrimitive.Group>;
  let { children, ...rest }: Props = $props();
</script>

<SelectPrimitive.Group {...rest}>
  {@render children?.()}
</SelectPrimitive.Group>
