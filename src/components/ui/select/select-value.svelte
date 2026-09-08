<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof SelectPrimitive.Value>;
  let { placeholder, class: className, ...rest }: Props = $props();
</script>

<SelectPrimitive.Value {placeholder} class={className} {...rest} />
