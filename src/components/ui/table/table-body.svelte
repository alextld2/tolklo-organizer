<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLTableSectionElement> & { class?: string };
  let { children, class: className, ...rest }: Props = $props();
</script>

<tbody class={cn("divide-y divide-gray-50 dark:divide-[#232830]/40 [&_tr:last-child]:border-0", className)} {...rest}>
  {@render children?.()}
</tbody>
