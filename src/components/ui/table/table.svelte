<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLTableAttributes } from "svelte/elements";

  type Props = HTMLTableAttributes & { class?: string };
  let { children, class: className, ...rest }: Props = $props();
</script>

<div class="relative w-full overflow-x-auto">
  <table class={cn("w-full caption-bottom text-sm border-collapse", className)} {...rest}>
    {@render children?.()}
  </table>
</div>
