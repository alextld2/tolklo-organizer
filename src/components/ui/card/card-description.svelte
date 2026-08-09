<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLParagraphElement> & { class?: string };
  let { children, class: className, ...rest }: Props = $props();
</script>

<p class={cn("text-xs text-muted-foreground font-medium", className)} {...rest}>
  {@render children?.()}
</p>
