<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLTableSectionElement> & { class?: string };
  let { children, class: className, ...rest }: Props = $props();
</script>

<thead class={cn("border-b border-gray-100 dark:border-[#232830] bg-gray-50/50 dark:bg-[#1E2228]/20 [&_tr]:border-b", className)} {...rest}>
  {@render children?.()}
</thead>
