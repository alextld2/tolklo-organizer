<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLSpanElement>;
  let { children, class: className, ...rest }: Props = $props();
</script>

<span
  class={cn("ml-auto text-[10px] tracking-widest text-slate-500 dark:text-slate-400", className)}
  {...rest}
>
  {@render children?.()}
</span>
