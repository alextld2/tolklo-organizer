<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLTableCaptionElement> & { class?: string };
  let { children, class: className, ...rest }: Props = $props();
</script>

<caption class={cn("mt-4 text-xs text-muted-foreground", className)} {...rest}>
  {@render children?.()}
</caption>
