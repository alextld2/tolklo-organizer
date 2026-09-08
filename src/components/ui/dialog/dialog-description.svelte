<script lang="ts">
  import { Dialog as DialogPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof DialogPrimitive.Description>;
  let { children, class: className, ...rest }: Props = $props();
</script>

<DialogPrimitive.Description
  class={cn("text-xs text-muted-foreground", className)}
  {...rest}
>
  {@render children?.()}
</DialogPrimitive.Description>
