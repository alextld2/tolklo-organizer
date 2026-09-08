<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof SelectPrimitive.Root>;
  let { children, type = "single", value = $bindable(), open = $bindable(false), ...rest }: Props = $props();
</script>

<SelectPrimitive.Root {type} bind:value bind:open {...rest}>
  {@render children?.()}
</SelectPrimitive.Root>
