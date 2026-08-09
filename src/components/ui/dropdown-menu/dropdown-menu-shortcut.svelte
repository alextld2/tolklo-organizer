<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "$lib/utils";

  type Props = HTMLAttributes<HTMLSpanElement> & { class?: string };
  let { children, class: className, ...rest }: Props = $props();
</script>

<span
  class={cn("ml-auto text-[10px] tracking-widest text-gray-400 dark:text-gray-500 font-mono font-medium", className)}
  {...rest}
>
  {@render children?.()}
</span>
