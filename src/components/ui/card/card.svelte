<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLDivElement> & { class?: string };
  let { children, class: className, ...rest }: Props = $props();
</script>

<div
  class={cn("rounded-2xl border border-border bg-card text-card-foreground shadow-xs transition-all", className)}
  {...rest}
>
  {@render children?.()}
</div>
