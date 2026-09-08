<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  import { Check } from "lucide-svelte";
  import { cn } from "$lib/utils";
  import type { ComponentProps, Snippet } from "svelte";

  type Props = ComponentProps<typeof SelectPrimitive.Item> & {
    children?: Snippet<[{ selected: boolean; highlighted: boolean }]>;
  };
  let { children: childrenProp, class: className, value, label, ...rest }: Props = $props();
</script>

<SelectPrimitive.Item
  {value}
  label={label ?? value}
  class={cn(
    "relative flex w-full cursor-pointer select-none items-center justify-between rounded-xl py-2 px-3 text-xs font-medium outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground transition-colors",
    className
  )}
  {...rest}
>
  {#snippet children({ selected, highlighted })}
    <span class="truncate flex-1 text-left">
      {#if childrenProp}
        {@render childrenProp({ selected, highlighted })}
      {:else}
        {label ?? value}
      {/if}
    </span>
    {#if selected}
      <Check class="ml-2 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
    {/if}
  {/snippet}
</SelectPrimitive.Item>
