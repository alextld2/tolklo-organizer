<script lang="ts">
  import { Dialog as DialogPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof DialogPrimitive.Title>;
  let { children, class: className, ...rest }: Props = $props();
</script>

<DialogPrimitive.Title
  class={cn("text-xl font-semibold leading-none tracking-tight text-foreground", className)}
  {...rest}
>
  {@render children?.()}
</DialogPrimitive.Title>
