<script lang="ts">
  import { Dialog as DialogPrimitive } from "bits-ui";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof DialogPrimitive.Close>;
  let { children, ...rest }: Props = $props();
</script>

<DialogPrimitive.Close {...rest}>
  {@render children?.()}
</DialogPrimitive.Close>
