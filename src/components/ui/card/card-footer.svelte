<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLDivElement> & { class?: string };
  let { children, class: className, ...rest }: Props = $props();
</script>

<div class={cn("flex items-center p-6 pt-0", className)} {...rest}>
  {@render children?.()}
</div>
