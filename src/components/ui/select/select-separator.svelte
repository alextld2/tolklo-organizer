<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLDivElement> & { class?: string };
  let { class: className, ...rest }: Props = $props();
</script>

<div class={cn("-mx-1 my-1 h-px bg-border", className)} {...rest}></div>
