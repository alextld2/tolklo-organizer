<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLHeadingElement> & { class?: string };
  let { children, class: className, ...rest }: Props = $props();
</script>

<h3 class={cn("text-lg font-semibold leading-none tracking-tight text-foreground", className)} {...rest}>
  {@render children?.()}
</h3>
