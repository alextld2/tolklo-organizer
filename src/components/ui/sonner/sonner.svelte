<script lang="ts">
  import { Toaster as Sonner, type ToasterProps as SonnerProps } from "svelte-sonner";

  let { ...restProps }: SonnerProps = $props();
</script>

<Sonner
  class="toaster group"
  style="font-family: inherit;"
  toastOptions={{
    classes: {
      toast:
        "group toast group-[.toaster]:bg-white dark:group-[.toaster]:bg-[#16191D] group-[.toaster]:text-[#1A1D21] dark:group-[.toaster]:text-[#EDF0F3] group-[.toaster]:border-gray-200 dark:group-[.toaster]:border-[#232830] group-[.toaster]:shadow-xl group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:text-xs group-[.toaster]:font-semibold",
      description: "group-[.toast]:text-gray-500 dark:group-[.toast]:text-gray-400 text-[11px]",
      actionButton:
        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
      cancelButton:
        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
    },
  }}
  {...restProps}
/>
