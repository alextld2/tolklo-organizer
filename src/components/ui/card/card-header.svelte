<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLDivElement> & { class?: string };
  let { children, class: className, ...rest }: Props = $props();
</script>

<div class={cn("flex flex-col space-y-1.5 p-6", className)} {...rest}>
  {@render children?.()}
</div>
