<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof SelectPrimitive.GroupHeading>;
  let { children, class: className, ...rest }: Props = $props();
</script>

<SelectPrimitive.GroupHeading
  class={cn("py-1.5 pl-8 pr-2 text-[11px] font-semibold text-muted-foreground", className)}
  {...rest}
>
  {@render children?.()}
</SelectPrimitive.GroupHeading>
