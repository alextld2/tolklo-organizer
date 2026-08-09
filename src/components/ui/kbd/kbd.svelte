<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  type $$Props = HTMLAttributes<HTMLElement>;

  let className: string | undefined = undefined;
  export { className as class };
</script>

<kbd
  class={cn(
    "pointer-events-none inline-flex h-5.5 select-none items-center justify-center rounded-lg border border-border/50 bg-muted/80 px-2 font-sans text-[10px] font-medium text-muted-foreground/90 shadow-2xs transition-colors",
    className
  )}
  {...$$restProps}
>
  <slot />
</kbd>
