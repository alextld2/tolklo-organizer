<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLInputAttributes } from "svelte/elements";

  type Props = HTMLInputAttributes & { class?: string };

  let {
    class: className,
    value = $bindable(),
    oninput,
    onblur,
    onchange,
    onclick,
    onfocus,
    onkeydown,
    onkeypress,
    onkeyup,
    onmouseenter,
    onmouseleave,
    onpaste,
    ...rest
  }: Props = $props();
</script>

<input
  class={cn(
    "flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-xs font-medium text-foreground shadow-xs transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  bind:value
  {oninput}
  {onblur}
  {onchange}
  {onclick}
  {onfocus}
  {onkeydown}
  {onkeypress}
  {onkeyup}
  {onmouseenter}
  {onmouseleave}
  {onpaste}
  {...rest}
/>
