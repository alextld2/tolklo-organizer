<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import { ChevronDown } from "lucide-svelte";
  import { cn } from "$lib/utils";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof SelectPrimitive.Trigger>;
  let { children, class: className, ...rest }: Props = $props();
</script>

<SelectPrimitive.Trigger
  class={cn(
    "flex h-9 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-1 text-xs font-medium text-foreground shadow-2xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 cursor-pointer",
    className
  )}
  {...rest}
>
  {@render children?.()}
  <ChevronDown class="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
</SelectPrimitive.Trigger>
