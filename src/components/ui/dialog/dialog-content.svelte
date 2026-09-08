<script lang="ts">
  import { Dialog as DialogPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";
  import { X } from "lucide-svelte";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<typeof DialogPrimitive.Content> & {
    showClose?: boolean;
  };
  let { children, class: className, showClose = true, ...rest }: Props = $props();
</script>

<DialogPrimitive.Content
  class={cn(
    "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-3xl",
    className
  )}
  {...rest}
>
  {@render children?.()}
  {#if showClose}
    <DialogPrimitive.Close
      class="absolute right-5 top-5 rounded-xl p-1.5 text-muted-foreground opacity-70 transition-all hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
    >
      <X size={18} strokeWidth={2} />
      <span class="sr-only">Cerrar</span>
    </DialogPrimitive.Close>
  {/if}
</DialogPrimitive.Content>
